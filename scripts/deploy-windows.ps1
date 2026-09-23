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

function Invoke-Pnpm {
  param([Parameter(Mandatory = $true)][string[]]$Arguments)

  & pnpm @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "pnpm $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
  }
}

function Install-ReleaseDependencies {
  param([Parameter(Mandatory = $true)][string]$ReleasePath)

  Push-Location $ReleasePath
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

if (Test-Path -LiteralPath $previousRelease) {
  Remove-Item -LiteralPath $previousRelease -Recurse -Force
}

try {
  Stop-ApplicationService

  Invoke-Robocopy `
    -From $deployment `
    -To $previousRelease `
    -ExtraArguments @('/MIR', '/XD', 'uploads', 'logs', 'node_modules')
  $previousReleasePrepared = $true

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
  if (Test-Path -LiteralPath $stagedRelease) {
    Remove-Item -LiteralPath $stagedRelease -Recurse -Force -ErrorAction SilentlyContinue
  }
}

Write-Host "Deployment completed, health verification passed, and service '$ServiceName' is running."