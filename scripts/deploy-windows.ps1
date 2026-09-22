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
$failedRelease = Join-Path $deploymentParent "$deploymentName.failed-$releaseId"
$oldReleaseMoved = $false
$newReleaseActivated = $false

function Invoke-Robocopy {
  param(
    [Parameter(Mandatory = $true)][string]$From,
    [Parameter(Mandatory = $true)][string]$To,
    [string[]]$ExtraArguments = @()
  )

  New-Item -ItemType Directory -Path $To -Force | Out-Null
  & robocopy $From $To /E /R:2 /W:2 /NFL /NDL /NJH /NJS /NP @ExtraArguments
  if ($LASTEXITCODE -ge 8) {
    throw "robocopy failed with exit code $LASTEXITCODE while copying '$From' to '$To'."
  }
}

function Invoke-Pnpm {
  param([Parameter(Mandatory = $true)][string[]]$Arguments)

  & pnpm @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "pnpm $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
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
    try {
      $response = Invoke-WebRequest `
        -Uri $Uri `
        -Method Get `
        -SkipHttpErrorCheck `
        -TimeoutSec 15
      $lastResult = "HTTP $($response.StatusCode)"
      if ($response.StatusCode -eq $ExpectedStatus) {
        return
      }
    } catch {
      $lastResult = $_.Exception.Message
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

    if ($newReleaseActivated -and (Test-Path -LiteralPath $deployment)) {
      $activeUploads = Join-Path $deployment 'uploads'
      $previousUploads = Join-Path $previousRelease 'uploads'
      if ((Test-Path -LiteralPath $activeUploads) -and (Test-Path -LiteralPath $previousRelease)) {
        Remove-Item -LiteralPath $previousUploads -Recurse -Force -ErrorAction SilentlyContinue
        Move-Item -LiteralPath $activeUploads -Destination $previousUploads
      }
      Move-Item -LiteralPath $deployment -Destination $failedRelease
    }

    if ($oldReleaseMoved -and (Test-Path -LiteralPath $previousRelease)) {
      Move-Item -LiteralPath $previousRelease -Destination $deployment
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

Get-Service -Name $ServiceName -ErrorAction Stop | Out-Null
Assert-ServiceEnvironment
New-Item -ItemType Directory -Path $deploymentParent -Force | Out-Null
if (-not (Test-Path -LiteralPath $deployment -PathType Container)) {
  throw "The existing deployment directory '$deployment' was not found; refusing a first-time deployment without a rollback source."
}

if (Test-Path -LiteralPath $stagedRelease) {
  Remove-Item -LiteralPath $stagedRelease -Recurse -Force
}

Invoke-Robocopy `
  -From $source `
  -To $stagedRelease `
  -ExtraArguments @(
    '/XD',
    (Join-Path $source '.git'),
    (Join-Path $source '.github'),
    (Join-Path $source '.agents'),
    (Join-Path $source '.local'),
    (Join-Path $source 'node_modules'),
    (Join-Path $source 'uploads')
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

try {
  Stop-ApplicationService

  if (Test-Path -LiteralPath $previousRelease) {
    Remove-Item -LiteralPath $previousRelease -Recurse -Force
  }
  if (Test-Path -LiteralPath $deployment) {
    Move-Item -LiteralPath $deployment -Destination $previousRelease
    $oldReleaseMoved = $true
  }

  Move-Item -LiteralPath $stagedRelease -Destination $deployment
  $newReleaseActivated = $true

  $oldUploads = Join-Path $previousRelease 'uploads'
  if (Test-Path -LiteralPath $oldUploads) {
    Move-Item -LiteralPath $oldUploads -Destination (Join-Path $deployment 'uploads')
  } else {
    New-Item -ItemType Directory -Path (Join-Path $deployment 'uploads\announcements') -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $deployment 'uploads\documents') -Force | Out-Null
  }

  Push-Location $deployment
  try {
    Invoke-Pnpm -Arguments @(
      'install',
      '--frozen-lockfile',
      '--prod=false',
      '--offline',
      '--force'
    )
  } finally {
    Pop-Location
  }

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
  if (Test-Path -LiteralPath $stagedRelease) {
    Remove-Item -LiteralPath $stagedRelease -Recurse -Force -ErrorAction SilentlyContinue
  }
}

if (Test-Path -LiteralPath $failedRelease) {
  Remove-Item -LiteralPath $failedRelease -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Deployment completed, health verification passed, and service '$ServiceName' is running."