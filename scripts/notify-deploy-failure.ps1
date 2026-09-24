[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$WebhookUrl,
  [Parameter(Mandatory = $true)][string]$DeployError,
  [Parameter(Mandatory = $true)][string]$RollbackSucceeded,
  [string]$RollbackError = '',
  [Parameter(Mandatory = $true)][string]$RunUrl
)

$ErrorActionPreference = 'Stop'

$rolledBack = $RollbackSucceeded -eq 'true'

if ($rolledBack) {
  $title = 'Production deploy failed - rolled back to previous release'
  $color = 'FFA500'
  $statusLine = 'Rollback succeeded. Production is running the previous release, not the latest code.'
} else {
  $title = 'Production deploy failed AND rollback failed'
  $color = 'FF0000'
  $statusLine = 'Rollback also failed. Production may be down or in an inconsistent state - investigate immediately.'
}

$facts = @(
  @{ name = 'Deploy error'; value = $DeployError }
)
if ($RollbackError) {
  $facts += @{ name = 'Rollback error'; value = $RollbackError }
}

$payload = @{
  '@type'      = 'MessageCard'
  '@context'   = 'http://schema.org/extensions'
  summary      = $title
  themeColor   = $color
  title        = $title
  text         = $statusLine
  sections     = @(
    @{ facts = $facts }
  )
  potentialAction = @(
    @{
      '@type'  = 'OpenUri'
      name     = 'View GitHub Actions run'
      targets  = @(@{ os = 'default'; uri = $RunUrl })
    }
  )
}

$body = $payload | ConvertTo-Json -Depth 6
Invoke-RestMethod -Uri $WebhookUrl -Method Post -ContentType 'application/json' -Body $body | Out-Null
Write-Host "Notified Microsoft Teams: $title"
