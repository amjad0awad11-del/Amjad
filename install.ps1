# J.A.R.V.I.S. — Installation für Windows
#
# In PowerShell einfügen und Enter drücken:
#
#   irm https://raw.githubusercontent.com/amjad0awad11-del/Amjad/refs/heads/claude/jarvis-assistant-2428an/install.ps1 | iex
#
# Lädt das Projekt nach %USERPROFILE%\jarvis, installiert alles Nötige
# und startet J.A.R.V.I.S. Es muss nichts von Hand gesucht werden.

$ErrorActionPreference = 'Stop'

# Alles mitschreiben. Geht etwas schief, liegt der vollstaendige Verlauf als
# Datei auf dem Schreibtisch und kann einfach weitergegeben werden — besser
# als eine Fehlermeldung aus einem Fenster abzutippen.
$LogFile = Join-Path ([Environment]::GetFolderPath('Desktop')) 'jarvis-log.txt'
try { Start-Transcript -Path $LogFile -Force | Out-Null } catch { $LogFile = $null }

$Repo    = 'amjad0awad11-del/Amjad'
$Branch  = 'claude/jarvis-assistant-2428an'
$Target  = Join-Path $HOME 'jarvis'
$ZipUrl  = "https://github.com/$Repo/archive/refs/heads/$Branch.zip"

function Say($text)  { Write-Host "  $text" }
function Good($text) { Write-Host "  $text" -ForegroundColor Green }
function Bad($text)  { Write-Host "  $text" -ForegroundColor Red }
function Bye {
  if ($LogFile) {
    Write-Host ''
    Write-Host "  Der vollstaendige Verlauf liegt hier:" -ForegroundColor Yellow
    Write-Host "  $LogFile" -ForegroundColor Yellow
    Write-Host '  Diese Datei genuegt, um den Fehler zu finden.'
    try { Stop-Transcript | Out-Null } catch { }
  }
}

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
  Bye
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
  Bye
  return
}

Expand-Archive -Path $tmpZip -DestinationPath $tmpDir -Force
Remove-Item $tmpZip -Force

# Das Archiv enthaelt einen Unterordner (z. B. Amjad-claude-jarvis-assistant-2428an).
$inner = Get-ChildItem -Path $tmpDir -Directory | Select-Object -First 1
if (-not $inner) {
  Bad 'Das Archiv sah anders aus als erwartet.'
  Bye
  return
}

# Vorhandene Schluessel und Einstellungen retten. Beides gehoert dem Nutzer
# und darf ein Update nicht ueberleben muessen, sondern muss es.
$keepEnv = $null
$envPath = Join-Path $Target 'server\.env'
if (Test-Path $envPath) { $keepEnv = Get-Content $envPath -Raw }

$keepConn = $null
$connPath = Join-Path $Target 'server\connectors.json'
if (Test-Path $connPath) { $keepConn = Get-Content $connPath -Raw }

if (Test-Path $Target) { Remove-Item $Target -Recurse -Force }
Move-Item -Path $inner.FullName -Destination $Target
Remove-Item $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
Good "Projekt liegt in $Target"

# ---------- 3. Abhaengigkeiten ----------
Say 'Installiere die Bausteine — das dauert etwa eine Minute ...'
Push-Location $Target
try {
  # npm schreibt Warnungen nach stderr. Zusammen mit ErrorActionPreference
  # 'Stop' würde PowerShell daraus einen echten Abbruch machen, obwohl die
  # Installation geklappt hat — deshalb hier bewusst abgeschaltet und nur
  # der Rückgabewert ausgewertet.
  $prevEAP = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  # Ausdruecklich npm.cmd statt npm: "npm" landet in PowerShell bei npm.ps1,
  # und Skripte sind auf vielen Windows-Rechnern gesperrt (Execution Policy).
  # Die .cmd-Fassung ist davon nicht betroffen - so muss an den
  # Sicherheitseinstellungen des Rechners nichts geaendert werden.
  $npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
  if ($npmCmd) {
    & $npmCmd.Source install --prefix server --no-audit --no-fund | Out-Null
  } else {
    & cmd /c "npm install --prefix server --no-audit --no-fund" | Out-Null
  }
  $npmCode = $LASTEXITCODE
  $ErrorActionPreference = $prevEAP
  if ($npmCode -ne 0) { throw "npm install endete mit Code $npmCode" }
} catch {
  Pop-Location
  Bad "Die Installation ist fehlgeschlagen: $($_.Exception.Message)"
  Say 'Falls es an gesperrten Skripten liegt: den Ordner jarvis oeffnen und'
  Say 'dort START-WINDOWS.bat doppelklicken - das umgeht die Sperre.'
  Bye
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

if ($keepConn) {
  Set-Content -Path (Join-Path $Target 'server\connectors.json') -Value $keepConn -NoNewline
  Good 'Deine Connectors sind unveraendert geblieben.'
}

# ---------- 5. Starten ----------
Write-Host ''
Good 'Fertig. J.A.R.V.I.S. startet jetzt.'
Write-Host ''
Say 'Der Browser oeffnet sich gleich auf http://localhost:8787/'
Say 'Falls nicht: die Adresse http://localhost:8787/ von Hand eingeben.'
Say 'Dieses Fenster offen lassen — Schliessen beendet J.A.R.V.I.S.'
Say 'Spaeter erneut starten: START-WINDOWS.bat im Ordner jarvis doppelklicken.'
Write-Host ''

# Eigener Prozess statt Start-Job: der oeffnet den Browser zuverlaessig
# auch dann, wenn dieses Fenster gleich mit dem Dienst blockiert ist.
Start-Process powershell -WindowStyle Hidden -ArgumentList @(
  '-NoProfile', '-Command',
  'Start-Sleep -Seconds 5; Start-Process "http://localhost:8787/"'
) -ErrorAction SilentlyContinue

if ($LogFile) { try { Stop-Transcript | Out-Null } catch { } }

& node (Join-Path $Target 'server\jarvis-proxy.mjs')
Pop-Location
