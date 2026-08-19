@echo off
REM ===========================================================
REM  J.A.R.V.I.S. - Installation fuer Windows
REM
REM  Diese Datei herunterladen und doppelklicken. Mehr nicht.
REM  Sie benutzt nur, was in Windows schon eingebaut ist
REM  (curl und tar) - kein PowerShell, kein Git noetig.
REM ===========================================================
setlocal enabledelayedexpansion
title J.A.R.V.I.S. Installation

set "ZIPURL=https://github.com/amjad0awad11-del/Amjad/archive/refs/heads/claude/jarvis-assistant-2428an.zip"
set "INNER=Amjad-claude-jarvis-assistant-2428an"
set "TARGET=%USERPROFILE%\jarvis"
set "WORK=%TEMP%\jarvis-setup"
set "LOG=%USERPROFILE%\Desktop\jarvis-log.txt"
if not exist "%USERPROFILE%\Desktop" set "LOG=%USERPROFILE%\jarvis-log.txt"

echo ================================ > "%LOG%"
echo  J.A.R.V.I.S. Installationslauf >> "%LOG%"
echo  %DATE% %TIME% >> "%LOG%"
echo ================================ >> "%LOG%"

echo.
echo   ================================
echo    J.A.R.V.I.S. wird eingerichtet
echo   ================================
echo.

REM ---------- 1. Node.js ----------
where node >nul 2>nul
if errorlevel 1 (
  echo   FEHLER: Node.js ist nicht installiert.
  echo   FEHLER: Node.js fehlt >> "%LOG%"
  echo.
  echo   1. https://nodejs.org oeffnen
  echo   2. Den grossen Knopf "LTS" herunterladen und installieren
  echo   3. Diese Datei danach erneut doppelklicken
  echo.
  echo   Protokoll: %LOG%
  echo.
  pause
  exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set "NODEVER=%%v"
echo   Node.js !NODEVER! gefunden.
echo Node: !NODEVER! >> "%LOG%"

REM ---------- 2. Herunterladen ----------
echo   Lade das Projekt ...
if exist "%WORK%" rmdir /s /q "%WORK%"
mkdir "%WORK%" 2>nul
curl -L --fail --silent --show-error -o "%WORK%\jarvis.zip" "%ZIPURL%" >> "%LOG%" 2>&1
if errorlevel 1 (
  echo   FEHLER: Der Download ist fehlgeschlagen.
  echo   FEHLER: Download fehlgeschlagen >> "%LOG%"
  echo   Internetverbindung pruefen, dann erneut doppelklicken.
  echo.
  echo   Protokoll: %LOG%
  echo.
  pause
  exit /b 1
)
echo Download ok >> "%LOG%"

REM ---------- 3. Entpacken ----------
echo   Entpacke ...
tar -xf "%WORK%\jarvis.zip" -C "%WORK%" >> "%LOG%" 2>&1
if not exist "%WORK%\%INNER%\server\jarvis-proxy.mjs" (
  echo   FEHLER: Das Archiv liess sich nicht entpacken.
  echo   FEHLER: Entpacken fehlgeschlagen >> "%LOG%"
  dir "%WORK%" >> "%LOG%" 2>&1
  echo.
  echo   Protokoll: %LOG%
  echo.
  pause
  exit /b 1
)
echo Entpacken ok >> "%LOG%"

REM ---------- 4. Schluessel retten und Ordner ersetzen ----------
if exist "%TARGET%\server\.env" (
  copy /y "%TARGET%\server\.env" "%WORK%\keep.env" >nul 2>&1
  echo Vorhandene .env gesichert >> "%LOG%"
)
if exist "%TARGET%" rmdir /s /q "%TARGET%"
move "%WORK%\%INNER%" "%TARGET%" >> "%LOG%" 2>&1
if not exist "%TARGET%\server\jarvis-proxy.mjs" (
  echo   FEHLER: Der Ordner liess sich nicht anlegen.
  echo   FEHLER: move fehlgeschlagen >> "%LOG%"
  echo.
  echo   Protokoll: %LOG%
  echo.
  pause
  exit /b 1
)
echo   Projekt liegt in %TARGET%
echo Ziel: %TARGET% >> "%LOG%"

REM ---------- 5. Bausteine ----------
echo   Installiere die Bausteine - etwa eine Minute ...
pushd "%TARGET%"
call npm install --prefix server --no-audit --no-fund >> "%LOG%" 2>&1
if errorlevel 1 (
  popd
  echo   FEHLER: Die Installation der Bausteine ist fehlgeschlagen.
  echo   FEHLER: npm install fehlgeschlagen >> "%LOG%"
  echo   Meist blockiert eine Firewall den Zugriff auf npm.
  echo.
  echo   Protokoll: %LOG%
  echo.
  pause
  exit /b 1
)
echo   Bausteine installiert.
echo npm install ok >> "%LOG%"

REM ---------- 6. Schluesseldatei ----------
if exist "%WORK%\keep.env" (
  copy /y "%WORK%\keep.env" "%TARGET%\server\.env" >nul
  echo   Deine bisherigen Schluessel wurden uebernommen.
) else (
  if not exist "%TARGET%\server\.env" copy /y "%TARGET%\server\.env.example" "%TARGET%\server\.env" >nul
)
rmdir /s /q "%WORK%" 2>nul

REM ---------- 7. Starten ----------
echo.
echo   Fertig. J.A.R.V.I.S. startet jetzt.
echo.
echo   Der Browser oeffnet sich gleich auf http://localhost:8787/
echo   Falls nicht: diese Adresse von Hand eingeben.
echo.
echo   WICHTIG: Dieses Fenster offen lassen - Schliessen beendet J.A.R.V.I.S.
echo.
echo Start um %TIME% >> "%LOG%"

start "" /b cmd /c "timeout /t 5 /nobreak >nul & start "" http://localhost:8787/"
node server\jarvis-proxy.mjs

popd
echo.
echo   J.A.R.V.I.S. wurde beendet.
echo   Zum erneuten Starten: START-WINDOWS.bat im Ordner jarvis doppelklicken.
echo.
pause
