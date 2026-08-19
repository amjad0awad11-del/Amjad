# J.A.R.V.I.S. — Installation für Windows
#
# In PowerShell einfügen und Enter drücken:
#
#   irm https://raw.githubusercontent.com/amjad0awad11-del/Amjad/refs/heads/claude/jarvis-assistant-2428an/install.ps1 | iex
#
# Lädt das Projekt nach %USERPROFILE%\jarvis, installiert alles Nötige
# und startet J.A.R.V.I.S. Es muss nichts von Hand gesucht werden.

$ErrorActionPreference = 'Stop'

$Repo    = 'amjad0awad11-del/Amjad'
$Branch  = 'claude/jarvis-assistant-2428an'
$Target  = Join-Path $HOME 'jarvis'
$ZipUrl  = "https://github.com/$Repo/archive/refs/heads/$Branch.zip"

function Say($text)  { Write-Host "  $text" }
function Good($text) { Write-Host "  $text" -ForegroundColor Green }
function Bad($text)  { Write-Host "  $text" -ForegroundColor Red }

Write-Host ''
Write-Host '  ================================' -ForegroundColor Cyan
Write-Host '   J.A.R.V.I.S. wird eingerichtet' -ForegroundColor Cyan
Write-Host '  ================================' -ForegroundColor Cyan
Write-Host ''

# ---------- 1. Node.js ----------
function Refresh-Path {
  $machine = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
  $user    = [System.Environment]::GetEnvironmentVariable('Path', 'User')
  $env:Path = "$machine;$user"
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Say 'Node.js fehlt — ich versuche es zu installieren ...'
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    try {
      winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements | Out-Null
      Refresh-Path
    } catch {
      Say 'Die automatische Installation hat nicht geklappt.'
    }
  }
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host ''
  Bad 'Node.js konnte nicht installiert werden.'
  Write-Host ''
  Say '1. https://nodejs.org oeffnen'
  Say '2. Den grossen Knopf "LTS" herunterladen und installieren'
  Say '3. PowerShell schliessen, neu oeffnen und diesen Befehl erneut einfuegen'
  Write-Host ''
  return
}

Good "Node.js $(node -v) ist da."

# ---------- 2. Projekt holen ----------
Say 'Lade das Projekt ...'
$tmpZip = Join-Path $env:TEMP "jarvis-$(Get-Random).zip"
$tmpDir = Join-Path $env:TEMP "jarvis-$(Get-Random)"

try {
  Invoke-WebRequest -Uri $ZipUrl -OutFile $tmpZip -UseBasicParsing
} catch {
  Bad "Download fehlgeschlagen: $($_.Exception.Message)"
  Say 'Internetverbindung pruefen und den Befehl erneut einfuegen.'
  return
}

Expand-Archive -Path $tmpZip -DestinationPath $tmpDir -Force
Remove-Item $tmpZip -Force

# Das Archiv enthaelt einen Unterordner (z. B. Amjad-claude-jarvis-assistant-2428an).
$inner = Get-ChildItem -Path $tmpDir -Directory | Select-Object -First 1
if (-not $inner) {
  Bad 'Das Archiv sah anders aus als erwartet.'
  return
}

# Vorhandene Schluessel und Einstellungen retten.
$keepEnv = $null
$envPath = Join-Path $Target 'server\.env'
if (Test-Path $envPath) { $keepEnv = Get-Content $envPath -Raw }

if (Test-Path $Target) { Remove-Item $Target -Recurse -Force }
Move-Item -Path $inner.FullName -Destination $Target
Remove-Item $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
Good "Projekt liegt in $Target"

# ---------- 3. Abhaengigkeiten ----------
Say 'Installiere die Bausteine — das dauert etwa eine Minute ...'
Push-Location $Target
try {
  & npm install --prefix server --no-audit --no-fund 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "npm install endete mit Code $LASTEXITCODE" }
} catch {
  Pop-Location
  Bad "Die Installation ist fehlgeschlagen: $($_.Exception.Message)"
  Say 'Meist blockiert eine Firewall npm. Danach den Befehl erneut einfuegen.'
  return
}
Good 'Bausteine installiert.'

# ---------- 4. Schluesseldatei ----------
$envFile = Join-Path $Target 'server\.env'
if ($keepEnv) {
  Set-Content -Path $envFile -Value $keepEnv -NoNewline
  Good 'Deine bisherigen Schluessel wurden uebernommen.'
} elseif (-not (Test-Path $envFile)) {
  Copy-Item (Join-Path $Target 'server\.env.example') $envFile
  Say 'server\.env wurde angelegt (noch ohne Schluessel).'
}

# ---------- 5. Starten ----------
Write-Host ''
Good 'Fertig. J.A.R.V.I.S. startet jetzt.'
Write-Host ''
Say 'Der Browser oeffnet sich gleich auf http://localhost:8787/'
Say 'Dieses Fenster offen lassen — Schliessen beendet J.A.R.V.I.S.'
Say 'Spaeter erneut starten: START-WINDOWS.bat im Ordner jarvis doppelklicken.'
Write-Host ''

Start-Job -ScriptBlock {
  Start-Sleep -Seconds 5
  Start-Process 'http://localhost:8787/'
} | Out-Null

& node (Join-Path $Target 'server\jarvis-proxy.mjs')
Pop-Location
