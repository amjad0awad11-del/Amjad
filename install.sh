#!/usr/bin/env bash
#
# J.A.R.V.I.S. — Installation für macOS und Linux
#
# Im Terminal einfügen und Enter drücken:
#
#   curl -fsSL https://raw.githubusercontent.com/amjad0awad11-del/Amjad/refs/heads/claude/jarvis-assistant-2428an/install.sh | bash
#
# Lädt das Projekt nach ~/jarvis, installiert alles Nötige und startet
# J.A.R.V.I.S. Es muss nichts von Hand gesucht werden.

set -euo pipefail

REPO="amjad0awad11-del/Amjad"
BRANCH="claude/jarvis-assistant-2428an"
TARGET="${JARVIS_DIR:-$HOME/jarvis}"
ZIP_URL="https://github.com/${REPO}/archive/refs/heads/${BRANCH}.zip"
PORT="${PORT:-8787}"

say()  { printf '  %s\n' "$*"; }
good() { printf '  \033[32m%s\033[0m\n' "$*"; }
bad()  { printf '  \033[31m%s\033[0m\n' "$*"; }

printf '\n  \033[36m================================\033[0m\n'
printf '  \033[36m J.A.R.V.I.S. wird eingerichtet\033[0m\n'
printf '  \033[36m================================\033[0m\n\n'

# ---------- 1. Node.js ----------
if ! command -v node >/dev/null 2>&1; then
  bad 'Node.js fehlt.'
  echo
  say 'macOS mit Homebrew:  brew install node'
  say 'Sonst:               https://nodejs.org (Knopf "LTS")'
  say 'Danach diesen Befehl erneut einfügen.'
  echo
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  bad "Node.js $(node -v) ist zu alt — gebraucht wird 20 oder neuer."
  say 'Neuere Version von https://nodejs.org installieren.'
  exit 1
fi
good "Node.js $(node -v) ist da."

# ---------- 2. Projekt holen ----------
say 'Lade das Projekt …'
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if ! curl -fsSL "$ZIP_URL" -o "$TMP/jarvis.zip"; then
  bad 'Download fehlgeschlagen. Internetverbindung prüfen.'
  exit 1
fi

if command -v unzip >/dev/null 2>&1; then
  unzip -q "$TMP/jarvis.zip" -d "$TMP/out"
else
  bad 'Das Programm "unzip" fehlt.'
  say 'Unter Debian/Ubuntu:  sudo apt install unzip'
  exit 1
fi

INNER="$(find "$TMP/out" -mindepth 1 -maxdepth 1 -type d | head -1)"
if [ -z "$INNER" ]; then
  bad 'Das Archiv sah anders aus als erwartet.'
  exit 1
fi

# Schlüssel und Connectors retten, bevor der Ordner ersetzt wird. Beides
# gehört dem Nutzer und muss ein Update überleben.
KEEP_ENV=""
if [ -f "$TARGET/server/.env" ]; then
  KEEP_ENV="$(cat "$TARGET/server/.env")"
fi
KEEP_CONN=""
if [ -f "$TARGET/server/connectors.json" ]; then
  KEEP_CONN="$(cat "$TARGET/server/connectors.json")"
fi

rm -rf "$TARGET"
mkdir -p "$(dirname "$TARGET")"
mv "$INNER" "$TARGET"
good "Projekt liegt in $TARGET"

# ---------- 3. Abhängigkeiten ----------
say 'Installiere die Bausteine — das dauert etwa eine Minute …'
if ! npm install --prefix "$TARGET/server" --no-audit --no-fund >/dev/null 2>&1; then
  bad 'Die Installation ist fehlgeschlagen (blockiert eine Firewall npm?).'
  exit 1
fi
good 'Bausteine installiert.'

# ---------- 4. Schlüsseldatei ----------
if [ -n "$KEEP_ENV" ]; then
  printf '%s\n' "$KEEP_ENV" > "$TARGET/server/.env"
  good 'Deine bisherigen Schlüssel wurden übernommen.'
elif [ ! -f "$TARGET/server/.env" ]; then
  cp "$TARGET/server/.env.example" "$TARGET/server/.env"
  say 'server/.env wurde angelegt (noch ohne Schlüssel).'
fi

if [ -n "$KEEP_CONN" ]; then
  printf '%s\n' "$KEEP_CONN" > "$TARGET/server/connectors.json"
  good 'Deine Connectors sind unverändert geblieben.'
fi

chmod +x "$TARGET/start.sh" 2>/dev/null || true

# ---------- 5. Starten ----------
echo
good 'Fertig. J.A.R.V.I.S. startet jetzt.'
echo
say "Der Browser öffnet sich gleich auf http://localhost:${PORT}/"
say 'Dieses Fenster offen lassen — Schließen beendet J.A.R.V.I.S.'
say "Später erneut starten:  cd $TARGET && ./start.sh"
echo

cd "$TARGET"
trap - EXIT
rm -rf "$TMP"
PORT="$PORT" exec ./start.sh
