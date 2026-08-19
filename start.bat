@echo off
REM
REM  J.A.R.V.I.S. starten (Windows)
REM
REM  Doppelklick auf diese Datei genuegt.
REM  Das Fenster muss offen bleiben - es IST J.A.R.V.I.S.
REM
setlocal
cd /d "%~dp0"

if "%PORT%"=="" set PORT=8787

echo.
echo   ================================
echo    J.A.R.V.I.S. wird gestartet
echo   ================================
echo.

REM ---- Liegt die Datei im richtigen Ordner? ----
if not exist "server\jarvis-proxy.mjs" (
  echo   FEHLER: Diese Datei liegt nicht im Projektordner.
  echo.
  echo   Erwartet wird der Ordner mit "jarvis.html" und dem Unterordner "server".
  echo   Beim Entpacken der ZIP-Datei entsteht oft ein Ordner im Ordner -
  echo   dann eine Ebene tiefer gehen und start.bat von dort starten.
  echo.
  echo   Aktueller Ordner: %CD%
  echo.
  pause
  exit /b 1
)

REM ---- Node vorhanden? ----
where node >nul 2>nul
if errorlevel 1 (
  echo   FEHLER: Node.js ist nicht installiert.
  echo.
  echo   1. https://nodejs.org oeffnen
  echo   2. Den grossen Knopf "LTS" herunterladen und installieren
  echo   3. Dieses Fenster schliessen und start.bat erneut doppelklicken
  echo.
  pause
  exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODEVER=%%v
echo   Node.js %NODEVER% gefunden.

REM ---- npm vorhanden? ----
where npm >nul 2>nul
if errorlevel 1 (
  echo.
  echo   FEHLER: npm fehlt, obwohl Node.js da ist.
  echo   Node.js bitte noch einmal von https://nodejs.org installieren.
  echo.
  pause
  exit /b 1
)

REM ---- Abhaengigkeiten ----
if not exist "server\node_modules" (
  echo   Installiere die Abhaengigkeiten - beim ersten Mal etwa eine Minute ...
  echo.
  call npm install --prefix server
  if errorlevel 1 (
    echo.
    echo   FEHLER: Die Installation ist fehlgeschlagen.
    echo   Meist fehlt die Internetverbindung oder eine Firewall blockiert npm.
    echo   Die letzten Zeilen oben zeigen den Grund.
    echo.
    pause
    exit /b 1
  )
  echo.
)

REM ---- Schluesseldatei ----
if not exist "server\.env" (
  copy /y "server\.env.example" "server\.env" >nul
  echo   server\.env wurde angelegt.
  echo   Ohne ANTHROPIC_API_KEY bleiben KI-Modus und Agent aus -
  echo   Zeit, Timer, Aufgaben und Rechnen laufen auch ohne.
  echo.
)

REM ---- Browser erst oeffnen, wenn der Dienst antwortet ----
start "" /b cmd /c "timeout /t 4 /nobreak >nul & start "" http://localhost:%PORT%/"

echo   Der Browser oeffnet sich gleich von selbst.
echo   Falls nicht: http://localhost:%PORT%/ von Hand oeffnen.
echo.
echo   WICHTIG: Dieses Fenster offen lassen. Schliessen beendet J.A.R.V.I.S.
echo.

node server\jarvis-proxy.mjs

echo.
echo   J.A.R.V.I.S. wurde beendet. Zum Starten start.bat erneut doppelklicken.
echo.
pause
