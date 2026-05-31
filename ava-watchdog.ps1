# Ava 72-hour uptime watchdog
# Runs every 10 min (Windows Task Scheduler). Checks the live endpoints and
# self-heals: starts any exited core container, and restarts n8n + the
# Cloudflare tunnel if n8n stops responding. Auto-removes itself after 72h.
$ErrorActionPreference = 'SilentlyContinue'
$base     = 'C:\Users\leeak\jeen-assignment'
$log      = Join-Path $base 'ava-watchdog.log'
$deadline = Join-Path $base 'ava-watchdog.deadline'
$taskName = 'AvaWatchdog72h'
$stamp    = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

# --- self-expiry after 72h ---
if (-not (Test-Path $deadline)) { (Get-Date).AddHours(72).ToString('o') | Out-File $deadline -Encoding ascii }
$end = [datetime]::Parse((Get-Content $deadline))
if ((Get-Date) -gt $end) {
  "$stamp  72h window elapsed -> removing watchdog task" | Out-File $log -Append -Encoding utf8
  schtasks /Delete /TN $taskName /F | Out-Null
  Remove-Item $deadline -Force
  exit
}

function Test-Url($url) {
  try { $r = Invoke-WebRequest -Uri $url -TimeoutSec 15 -UseBasicParsing; return [int]$r.StatusCode }
  catch { if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode } return 0 }
}
function Healthy($code) { return ($code -ge 200 -and $code -lt 400) }

$n8n   = Test-Url 'https://n8n.navada-edge-server.uk/healthz'
$front = Test-Url 'https://ava-albion-mutual.pages.dev/'
$action = ''

# 1) bring back any exited core container
$down = docker ps -a --filter 'name=navada-n8n' --filter 'name=navada-postgres' --filter 'name=navada-tunnel' --filter 'status=exited' --format '{{.Names}}'
if ($down) { foreach ($d in $down) { docker start $d | Out-Null }; $action += " STARTED[$($down -join ',')]" }

# 2) n8n unresponsive while container is 'Up' -> restart n8n + tunnel
if (-not (Healthy $n8n)) {
  docker restart navada-n8n  | Out-Null
  Start-Sleep -Seconds 6
  docker restart navada-tunnel | Out-Null
  $action += ' RESTARTED[n8n,tunnel]'
}

$state = if ((Healthy $n8n) -and (Healthy $front) -and -not $action) { 'OK' } else { 'HEAL' }
"$stamp  [$state]  n8n=$n8n front=$front$action" | Out-File $log -Append -Encoding utf8
