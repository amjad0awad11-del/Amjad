#!/usr/bin/env bash
#
# J.A.R.V.I.S. starten (macOS / Linux)
#
# Erstinstallation lieber mit install.sh — siehe README.
#
#   ./start.sh
#
# Kümmert sich um alles: Abhängigkeiten, Schlüsseldatei, Dienst, Browser.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

PORT="${PORT:-8787}"

say() { printf '\n  %s\n' "$*"; }

# ---- Node vorhanden? ----
if ! command -v node >/dev/null 2>&1; then
  say "Node.js fehlt."
  say "Bitte von https://nodejs.org installieren (Version 20 oder neuer), dann erneut starten."
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  say "Node.js $(node -v) ist zu alt — gebraucht wird 20 oder neuer."
  say "Neuere Version von https://nodejs.org installieren, dann erneut starten."
  exit 1
fi

# ---- Abhängigkeiten ----
if [ ! -d server/node_modules ]; then
  say "Installiere die Abhängigkeiten — das dauert beim ersten Mal etwa eine Minute …"
  npm install --prefix server --silent
fi

# ---- Schlüsseldatei ----
if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  say "server/.env wurde angelegt."
  say "Trag dort deine Schlüssel ein — ohne ANTHROPIC_API_KEY bleiben KI-Modus und Agent aus."
  say "Die eingebauten Befehle (Zeit, Timer, Aufgaben, Rechnen …) laufen auch ohne."
  printf '\n'
fi

# ---- Browser öffnen, sobald der Dienst antwortet ----
open_browser() {
  local url="http://localhost:${PORT}/"
  for _ in $(seq 1 40); do
    if curl -fsS -o /dev/null "${url}" 2>/dev/null; then
      if command -v open >/dev/null 2>&1; then open "${url}"
      elif command -v xdg-open >/dev/null 2>&1; then xdg-open "${url}" >/dev/null 2>&1
      fi
      return
    fi
    sleep 0.25
  done
}
open_browser &

# ---- Dienst starten (läuft im Vordergrund, Strg+C beendet) ----
PORT="${PORT}" exec node server/jarvis-proxy.mjs
