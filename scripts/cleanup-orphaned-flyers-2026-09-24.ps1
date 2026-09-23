[CmdletBinding()]
param(
  [string]$AnnouncementUploadDir = $(
    $fromEnv = [Environment]::GetEnvironmentVariable('ANNOUNCEMENT_UPLOAD_DIR', 'Machine')
    if ([string]::IsNullOrWhiteSpace($fromEnv)) {
      'C:\Planning\CPA-Planning-Platform\uploads\announcements'
    } else {
      $fromEnv
    }
  )
)

# One-off cleanup (2026-09-24): the 2026-09-23 production maintenance wiped
# announcements/comments/discussions/inquiries/suggestions directly via SQL
# (see setup-database.sql, operation 'wipe_test_data_2026_09_23'), bypassing
# the API's normal delete routes. Those routes are what normally unlink a
# flyer image file from disk when its announcement row is removed, so any
# flyer files that belonged to deleted announcements were left orphaned on
# disk. This script finds and archives them. It is safe to run more than
# once: once a file is archived it is gone from the source directory, so a
# second run simply finds zero orphans.
#
# Suggestions' `attachment` column is NOT included here: it is only a
# filename string captured client-side from a file picker (see
# artifacts/cpa-planning/src/pages/suggestions.tsx and
# artifacts/api-server/src/routes/suggestions.ts) -- there is no matching
# server-side upload/storage path for it, so no suggestion attachment files
# exist on disk to clean up. This script logs a few sample values as
# evidence of that instead of touching any files for suggestions.

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if ([string]::IsNullOrWhiteSpace($env:WINDOWS_DATABASE_URL)) {
  throw 'The production environment secret WINDOWS_DATABASE_URL is required.'
}
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
  throw 'psql is not installed or is not available on PATH for the runner service account.'
}
if (-not (Test-Path -LiteralPath $AnnouncementUploadDir -PathType Container)) {
  throw "Announcement upload directory '$AnnouncementUploadDir' was not found."
}

function Invoke-PsqlQuery {
  param([Parameter(Mandatory = $true)][string]$Sql)

  $output = & psql --set=ON_ERROR_STOP=1 --tuples-only --no-align --command $Sql $env:WINDOWS_DATABASE_URL
  if ($LASTEXITCODE -ne 0) {
    throw "psql query failed with exit code $LASTEXITCODE for: $Sql"
  }
  return @($output | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
}

function Get-BaseNameSet {
  param([string[]]$Paths)

  $set = [System.Collections.Generic.HashSet[string]]::new()
  foreach ($p in $Paths) {
    $null = $set.Add((Split-Path -Leaf ($p.TrimEnd('/').Replace('/', '\'))))
  }
  return $set
}

Write-Host '--- Suggestions attachment check (informational only, no files touched) ---'
$sampleAttachments = Invoke-PsqlQuery -Sql "SELECT attachment FROM suggestions WHERE attachment IS NOT NULL LIMIT 20;"
if ($sampleAttachments.Count -eq 0) {
  Write-Host 'No suggestions currently have a non-null attachment value.'
} else {
  Write-Host "Sample suggestion 'attachment' values (client-side filename labels, not server file paths):"
  foreach ($a in $sampleAttachments) { Write-Host "  - $a" }
}
Write-Host 'Suggestions have no server-side file storage for attachments; skipping file cleanup for suggestions.'
Write-Host ''

Write-Host '--- Orphaned announcement flyer file check ---'

# Flyer files still referenced by live announcements -- anything else on disk
# under $AnnouncementUploadDir is an orphan.
$referencedNames = Get-BaseNameSet -Paths (Invoke-PsqlQuery -Sql "SELECT flyer_path FROM announcements WHERE flyer_path IS NOT NULL;")

# Flyer files referenced before the 2026-09-23 wipe, kept only so the log
# below can note whether an orphan corresponds to a wiped announcement or is
# an unrelated stray file. This table does not gate what gets archived.
$backupNames = [System.Collections.Generic.HashSet[string]]::new()
try {
  $backupNames = Get-BaseNameSet -Paths (Invoke-PsqlQuery -Sql "SELECT flyer_path FROM announcements_backup_2026_09_23 WHERE flyer_path IS NOT NULL;")
} catch {
  Write-Warning "Could not read announcements_backup_2026_09_23 for cross-checking (continuing without it): $($_.Exception.Message)"
}

$diskFiles = @(Get-ChildItem -LiteralPath $AnnouncementUploadDir -File)
$orphans = @($diskFiles | Where-Object { -not $referencedNames.Contains($_.Name) })

Write-Host "Flyer files on disk: $($diskFiles.Count)"
Write-Host "Flyer files referenced by live announcements: $($referencedNames.Count)"
Write-Host "Orphaned flyer files found: $($orphans.Count)"

if ($orphans.Count -eq 0) {
  Write-Host 'Nothing to archive.'
} else {
  $archiveDir = Join-Path (Split-Path -Parent $AnnouncementUploadDir) '_orphaned-announcement-flyers-2026-09-24'
  New-Item -ItemType Directory -Path $archiveDir -Force | Out-Null

  foreach ($file in $orphans) {
    $wasInBackup = $backupNames.Contains($file.Name)
    $destination = Join-Path $archiveDir $file.Name
    Move-Item -LiteralPath $file.FullName -Destination $destination -Force
    $sizeKb = [math]::Round($file.Length / 1KB, 1)
    Write-Host "Archived '$($file.Name)' ($sizeKb KB) -- previously referenced in announcements_backup_2026_09_23: $wasInBackup"
  }

  Write-Host "Archived $($orphans.Count) orphaned flyer file(s) to '$archiveDir'."
}
