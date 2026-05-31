# =============================================================================
# sync-n8n-workflows.ps1
# Keeps the repo's workflow/*.json in sync with the LIVE n8n engine, so Git
# stays the source of truth even after edits made directly in n8n / via the
# Claude extension. Exports each Jeen workflow, redacts the live auth tokens
# back to placeholders (so no secrets are committed), writes them to the repo
# with their canonical filenames, and commits any changes.
#
# Run manually:  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\sync-n8n-workflows.ps1
# Scheduled:     a Windows Task ("JeenN8nWorkflowSync") runs this daily.
# =============================================================================
$ErrorActionPreference = 'Stop'
$repo = 'C:\Users\leeak\jeen-assignment'
$wfDir = Join-Path $repo 'workflow'

# Live workflow id  ->  canonical repo filename
$map = @{
  'JeenClaimsChat1'      = 'claims-chat-agent.json'
  'JeenTeamAPI1'         = 'claims-team-api.json'
  'JeenAdminAPI1'        = 'claims-admin-api.json'
  'JeenUserAPI1'         = 'claims-user-api.json'
  'JeenKBSearch1'        = 'claims-kb-search.json'
  'JeenClaimsTriageAPI1' = 'claims-triage-api.json'
  'JeenAvaChatTrigger1'  = 'ava-n8n-chat.json'
  'JeenClaimsPortal1'    = 'claims-portal.json'
  'JeenClaimsTriage1'    = 'claims-triage-agent.json'
  'JeenAttachAPI1'       = 'claims-attach.json'
}

# Live secrets that must be redacted back to placeholders before committing.
$redactions = @{
  'jeen-team-7f2a9c4e1b'  = 'REPLACE_TEAM_TOKEN'
  'jeen-adm-9b3f7c1e5a2d8' = 'REPLACE_ADMIN_TOKEN'
}

Write-Host "Exporting workflows from navada-n8n..."
docker exec navada-n8n rm -rf /tmp/wfbackup 2>$null | Out-Null
docker exec navada-n8n n8n export:workflow --backup --output=/tmp/wfbackup 2>&1 | Out-Null

$tmp = Join-Path $env:TEMP 'jeen-wfsync'
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
$env:MSYS_NO_PATHCONV = '1'
docker cp navada-n8n:/tmp/wfbackup/. $tmp | Out-Null

$changed = 0
foreach ($id in $map.Keys) {
  $src = Join-Path $tmp "$id.json"
  if (-not (Test-Path $src)) { Write-Host "  ! missing export for $id"; continue }
  $content = Get-Content -Raw -LiteralPath $src
  foreach ($k in $redactions.Keys) { $content = $content.Replace($k, $redactions[$k]) }
  $dest = Join-Path $wfDir $map[$id]
  $existing = if (Test-Path $dest) { Get-Content -Raw -LiteralPath $dest } else { '' }
  if ($content -ne $existing) {
    Set-Content -LiteralPath $dest -Value $content -NoNewline -Encoding UTF8
    Write-Host "  updated $($map[$id])"
    $changed++
  }
}
Remove-Item $tmp -Recurse -Force

if ($changed -gt 0) {
  Push-Location $repo
  git add workflow/*.json
  $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm'
  git -c user.name='Lee Akpareva' -c user.email='leeakpareva@gmail.com' commit -m "chore: sync n8n workflows from live engine ($stamp)" | Out-Null
  Pop-Location
  Write-Host "Committed $changed updated workflow file(s)."
} else {
  Write-Host "No changes — repo already matches the live engine."
}
