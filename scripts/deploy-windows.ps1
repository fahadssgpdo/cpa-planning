[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$SourcePath,

  [string]$DeploymentPath = 'C:\Planning\CPA-Planning-Platform',

  [string]$ServiceName = 'CPAPlanningAP',

  [string]$HealthUrl = 'http://127.0.0.1:3000/api/healthz',

  [string]$PublicAuthUrl = 'https://planning.cpa.gov.om/api/auth/me'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$source = (Resolve-Path -LiteralPath $SourcePath).Path
$deployment = [System.IO.Path]::GetFullPath($DeploymentPath).TrimEnd('\')
$deploymentParent = Split-Path -Parent $deployment
$deploymentName = Split-Path -Leaf $deployment
$releaseId = [guid]::NewGuid().ToString('N')
$stagedRelease = Join-Path $deploymentParent "$deploymentName.next-$releaseId"
$previousRelease = Join-Path $deploymentParent "$deploymentName.previous"
$previousReleasePrepared = $false
$newReleaseActivated = $false

function Invoke-Robocopy {
  param(
    [Parameter(Mandatory = $true)][string]$From,
    [Parameter(Mandatory = $true)][string]$To,
    [string[]]$ExtraArguments = @()
  )

  New-Item -ItemType Directory -Path $To -Force | Out-Null
  & robocopy $From $To /E /XJ /R:2 /W:2 /NFL /NDL /NJH /NJS /NP @ExtraArguments
  if ($LASTEXITCODE -ge 8) {
    throw "robocopy failed with exit code $LASTEXITCODE while copying '$From' to '$To'."
  }
}

function Stop-ProcessTree {
  param([Parameter(Mandatory = $true)][int]$ProcessId)

  # taskkill's /T kills the full descendant tree (cmd.exe -> pnpm.cmd ->
  # node.exe), unlike Stop-Process, which only kills the single process we
  # have a handle to and leaves its children running.
  & taskkill.exe /PID $ProcessId /T /F 2>&1 | Out-Null
}

function Invoke-Pnpm {
  param(
    [Parameter(Mandatory = $true)][string[]]$Arguments,
    # A stuck pnpm install (e.g. blocked on a store lock) used to hang here
    # indefinitely: PowerShell's `&` call operator blocks with no timeout,
    # so a hang was only ever noticed hours later by GitHub Actions' job
    # timeout, and by then the underlying process couldn't even be killed
    # cleanly (see Stop-ProcessTree). Running pnpm as a real child process we
    # hold a handle to lets us bound the wait and forcibly kill the whole
    # process tree on timeout, turning a silent multi-hour hang into a
    # normal, catchable error within minutes.
    [int]$TimeoutSeconds = 600
  )

  $pnpmCommand = Get-Command pnpm -ErrorAction Stop
  $quotedArguments = $Arguments | ForEach-Object { '"' + $_ + '"' }
  # pnpm on Windows resolves to a .cmd shim, which Start-Process -NoNewWindow
  # (CreateProcess) cannot launch directly the way the shell can. Route it
  # through cmd.exe /c, the same way PowerShell's own `&` operator does under
  # the hood, so console output still streams live to the job log while we
  # keep a real Process handle to wait on and, if needed, kill.
  $commandLine = 'call "' + $pnpmCommand.Source + '" ' + ($quotedArguments -join ' ')

  $process = Start-Process `
    -FilePath 'cmd.exe' `
    -ArgumentList @('/d', '/c', $commandLine) `
    -WorkingDirectory (Get-Location).Path `
    -NoNewWindow `
    -PassThru

  $exited = $process.WaitForExit($TimeoutSeconds * 1000)
  if (-not $exited) {
    Stop-ProcessTree -ProcessId $process.Id
    throw "pnpm $($Arguments -join ' ') timed out after $TimeoutSeconds seconds and its process tree was terminated. This usually means a stale pnpm store lock left behind by a previous deploy attempt that wasn't fully terminated."
  }

  if ($process.ExitCode -ne 0) {
    throw "pnpm $($Arguments -join ' ') failed with exit code $($process.ExitCode)."
  }
}

function Remove-DirectoryRobustly {
  param([Parameter(Mandatory = $true)][string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  # PowerShell's Remove-Item can fail with "Access to the path is denied" on
  # pnpm's node_modules trees: pnpm hardlinks package files from a shared,
  # read-only content store, and Remove-Item's own recursive delete does not
  # reliably clear those attributes even with -Force. Robocopy's file-removal
  # engine handles read-only/hardlinked files correctly, so empty the
  # directory by mirroring an empty folder onto it, then drop the empty
  # shell.
  $emptyDir = Join-Path $env:TEMP ("empty-" + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null
  try {
    & robocopy $emptyDir $Path /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
    if ($LASTEXITCODE -ge 8) {
      throw "robocopy failed with exit code $LASTEXITCODE while clearing '$Path'."
    }
    Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction SilentlyContinue
  } finally {
    Remove-Item -LiteralPath $emptyDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}

function Remove-NodeModules {
  param([Parameter(Mandatory = $true)][string]$ReleasePath)

  Remove-DirectoryRobustly -Path (Join-Path $ReleasePath 'node_modules')
}

function Install-ReleaseDependencies {
  param(
    [Parameter(Mandatory = $true)][string]$ReleasePath,
    # This install is offline and resolves entirely from the local package
    # store, so it should finish in well under a minute even on a slow disk.
    # A much shorter timeout than Invoke-Pnpm's network-install default is
    # intentional: it's exactly what turns a stuck-on-a-stale-lock hang into
    # a fast, catchable failure instead of a multi-hour one.
    [int]$TimeoutSeconds = 180
  )

  Push-Location $ReleasePath
  try {
    Invoke-Pnpm -Arguments @(
      'install',
      '--frozen-lockfile',
      '--prod=false',
      '--offline'
    ) -TimeoutSeconds $TimeoutSeconds
  } finally {
    Pop-Location
  }
}

function Stop-StalePnpmProcesses {
  # Root cause of the original multi-hour hangs: when GitHub Actions cancels
  # or times out a step, it can only signal the top-level shell process. The
  # underlying cmd.exe/pnpm.cmd/node.exe tree it spawned doesn't die with
  # it -- cmd.exe drops into an interactive "Terminate batch job (Y/N)?"
  # prompt that nothing ever answers, so the pnpm process (and the lock it
  # holds on the shared local package store) is left running indefinitely.
  # The next deploy's `pnpm install --offline` then blocks forever waiting
  # for a lock that a live-but-orphaned process keeps renewing, so it never
  # goes stale on its own. Sweep and kill any leftover pnpm-related
  # processes before starting a new deploy so this run can't inherit a
  # previous run's stuck state. This only ever targets processes whose
  # command line mentions pnpm, so it cannot touch the running application
  # service (which runs plain `node`, not `pnpm`).
  $staleProcesses = Get-CimInstance Win32_Process -Filter "Name = 'node.exe' OR Name = 'cmd.exe'" |
    Where-Object { $_.CommandLine -and $_.CommandLine -match 'pnpm' -and $_.ProcessId -ne $PID }

  foreach ($proc in $staleProcesses) {
    Write-Warning "Killing stale pnpm-related process left over from a previous deploy attempt: PID $($proc.ProcessId) - $($proc.CommandLine)"
    Stop-ProcessTree -ProcessId $proc.ProcessId
  }
}

function Assert-ServiceEnvironment {
  $requiredNames = @(
    'ANNOUNCEMENT_UPLOAD_DIR',
    'DATABASE_URL',
    'DOCUMENT_UPLOAD_DIR',
    'NODE_ENV',
    'PORT',
    'SESSION_SECRET',
    'STATIC_DIR'
  )

  $missing = @(
    $requiredNames | Where-Object {
      [string]::IsNullOrWhiteSpace(
        [Environment]::GetEnvironmentVariable($_, [EnvironmentVariableTarget]::Machine)
      )
    }
  )
  if ($missing.Count -gt 0) {
    throw "Required machine-level service environment variables are missing: $($missing -join ', ')."
  }
}

function Wait-ForHealth {
  param(
    [Parameter(Mandatory = $true)][string]$Uri,
    [Parameter(Mandatory = $true)][int]$ExpectedStatus,
    [int]$Attempts = 12,
    [int]$DelaySeconds = 5
  )

  $lastResult = 'no response'
  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    $statusCode = $null
    try {
      $response = Invoke-WebRequest `
        -Uri $Uri `
        -Method Get `
        -UseBasicParsing `
        -TimeoutSec 15
      $statusCode = [int]$response.StatusCode
    } catch {
      if ($null -ne $_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
      } else {
        $lastResult = $_.Exception.Message
      }
    }
    if ($null -ne $statusCode) {
      $lastResult = "HTTP $statusCode"
      if ($statusCode -eq $ExpectedStatus) {
        return
      }
    }
    if ($attempt -lt $Attempts) {
      Start-Sleep -Seconds $DelaySeconds
    }
  }

  throw "Health check '$Uri' did not return HTTP $ExpectedStatus after $Attempts attempts: $lastResult"
}

function Stop-ApplicationService {
  $service = Get-Service -Name $ServiceName -ErrorAction Stop
  if ($service.Status -ne 'Stopped') {
    Stop-Service -Name $ServiceName -Force
    (Get-Service -Name $ServiceName).WaitForStatus('Stopped', [TimeSpan]::FromSeconds(30))
  }
}

function Start-ApplicationService {
  if ((Get-Service -Name $ServiceName -ErrorAction Stop).Status -ne 'Running') {
    Start-Service -Name $ServiceName
    (Get-Service -Name $ServiceName).WaitForStatus('Running', [TimeSpan]::FromSeconds(30))
  }
}

function Restore-PreviousRelease {
  try {
    Stop-ApplicationService

    if (
      $newReleaseActivated -and
      $previousReleasePrepared -and
      (Test-Path -LiteralPath $previousRelease)
    ) {
      Remove-NodeModules -ReleasePath $deployment
      Invoke-Robocopy `
        -From $previousRelease `
        -To $deployment `
        -ExtraArguments @('/MIR', '/XD', 'uploads', 'logs', 'node_modules')
      Install-ReleaseDependencies -ReleasePath $deployment
    }
  } finally {
    Start-ApplicationService
  }
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  throw 'pnpm is not available on PATH for the runner service account.'
}
if (-not (Get-Command robocopy -ErrorAction SilentlyContinue)) {
  throw 'robocopy is not available on PATH for the runner service account.'
}

try {
  Stop-StalePnpmProcesses
} catch {
  Write-Warning "Failed to sweep stale pnpm processes from a previous deploy attempt: $($_.Exception.Message)"
}

Get-Service -Name $ServiceName -ErrorAction Stop | Out-Null
Assert-ServiceEnvironment
New-Item -ItemType Directory -Path $deploymentParent -Force | Out-Null
if (-not (Test-Path -LiteralPath $deployment -PathType Container)) {
  throw "The existing deployment directory '$deployment' was not found; refusing a first-time deployment without a rollback source."
}

Remove-DirectoryRobustly -Path $stagedRelease

Invoke-Robocopy `
  -From $source `
  -To $stagedRelease `
  -ExtraArguments @(
    '/XD',
    (Join-Path $source '.git'),
    (Join-Path $source '.github'),
    (Join-Path $source '.agents'),
    (Join-Path $source '.local'),
    (Join-Path $source 'uploads'),
    'node_modules'
  )

Push-Location $stagedRelease
try {
  $env:PORT = '3000'
  $env:BASE_PATH = '/'
  Invoke-Pnpm -Arguments @('install', '--frozen-lockfile', '--prod=false')
  $env:NODE_ENV = 'production'
  Invoke-Pnpm -Arguments @('--filter', '@workspace/api-server', 'run', 'build')
  Invoke-Pnpm -Arguments @('--filter', '@workspace/cpa-planning', 'run', 'build')
} finally {
  Pop-Location
}

Remove-DirectoryRobustly -Path $previousRelease

try {
  Stop-ApplicationService

  Invoke-Robocopy `
    -From $deployment `
    -To $previousRelease `
    -ExtraArguments @('/MIR', '/XD', 'uploads', 'logs', 'node_modules')
  $previousReleasePrepared = $true

  # Delete the live deployment's node_modules before mirroring the new release
  # into it. robocopy /MIR's extra-file purge pass does not reliably respect
  # /XD when the excluded directory already exists on the destination side —
  # it can end up trying (and failing) to delete every file inside it one by
  # one. Deleting it outright first avoids that entirely; the offline
  # dependency install below rebuilds it from the local package cache.
  Remove-NodeModules -ReleasePath $deployment

  Invoke-Robocopy `
    -From $stagedRelease `
    -To $deployment `
    -ExtraArguments @('/MIR', '/XD', 'uploads', 'logs', 'node_modules')
  $newReleaseActivated = $true

  if (-not (Test-Path -LiteralPath (Join-Path $deployment 'uploads'))) {
    New-Item -ItemType Directory -Path (Join-Path $deployment 'uploads\announcements') -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $deployment 'uploads\documents') -Force | Out-Null
  }

  Install-ReleaseDependencies -ReleasePath $deployment

  Start-ApplicationService
  Wait-ForHealth -Uri $HealthUrl -ExpectedStatus 200
  Wait-ForHealth -Uri $PublicAuthUrl -ExpectedStatus 401
} catch {
  $deploymentError = $_
  Write-Warning "Deployment failed: $($deploymentError.Exception.Message)"
  try {
    Restore-PreviousRelease
    Wait-ForHealth -Uri $HealthUrl -ExpectedStatus 200
  } catch {
    Write-Error "Rollback failed: $($_.Exception.Message)"
  }
  throw $deploymentError
} finally {
  Remove-DirectoryRobustly -Path $stagedRelease
}

Write-Host "Deployment completed, health verification passed, and service '$ServiceName' is running."