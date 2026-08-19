@echo off
REM
REM  J.A.R.V.I.S. starten (Windows)
REM
REM  Doppelklick auf diese Datei genuegt.
REM
setlocal
cd /d "%~dp0"

if "%PORT%"=="" set PORT=8787

REM ---- Node vorhanden? ----
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js fehlt.
  echo   Bitte von https://nodejs.org installieren ^(Version 20 oder neuer^),
  echo   danach diese Datei erneut starten.
  echo.
  pause
  exit /b 1
)

REM ---- Abhaengigkeiten ----
if not exist "server\node_modules" (
  echo.
  echo   Installiere die Abhaengigkeiten - das dauert beim ersten Mal etwa eine Minute ...
  call npm install --prefix server --silent
)

REM ---- Schluesseldatei ----
if not exist "server\.env" (
  copy /y "server\.env.example" "server\.env" >nul
  echo.
  echo   server\.env wurde angelegt.
  echo   Trag dort deine Schluessel ein - ohne ANTHROPIC_API_KEY bleiben
  echo   KI-Modus und Agent aus. Die eingebauten Befehle laufen auch ohne.
  echo.
)

REM ---- Browser erst oeffnen, wenn der Dienst antwortet ----
REM  Ohne die Wartezeit zeigt der Browser "Seite nicht erreichbar",
REM  weil er schneller da ist als der Dienst.
start "" /b cmd /c "timeout /t 4 /nobreak >nul & start "" http://localhost:%PORT%/"

echo.
echo   Starte J.A.R.V.I.S. ... der Browser oeffnet sich gleich von selbst.
echo   Falls nicht: http://localhost:%PORT%/ von Hand oeffnen.
echo.

node server\jarvis-proxy.mjs

echo.
echo   J.A.R.V.I.S. wurde beendet.
pause
