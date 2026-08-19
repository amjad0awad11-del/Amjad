# J.A.R.V.I.S. — Sprachassistent im Browser

Ein vollständiger Sprachassistent als statische Seite: `jarvis.html`, `jarvis.css`,
`jarvis.js`. Kein Build-Schritt, keine Abhängigkeiten, kein Konto nötig. Die
meisten Befehle laufen komplett auf dem Gerät; nur Wetter, Wikipedia und der
optionale KI-Modus brauchen Internet.

---

## Starten

Gebraucht wird nur [Node.js](https://nodejs.org) ab Version 20. Danach ein Befehl:

**macOS / Linux**

```bash
git clone -b claude/jarvis-assistant-2428an https://github.com/amjad0awad11-del/Amjad.git jarvis
cd jarvis
./start.sh
```

**Windows** — dasselbe in PowerShell, dann Doppelklick auf `start.bat`:

```powershell
git clone -b claude/jarvis-assistant-2428an https://github.com/amjad0awad11-del/Amjad.git jarvis
cd jarvis
.\start.bat
```

Das Startskript installiert beim ersten Mal die Abhängigkeiten, legt
`server/.env` an, startet den Dienst und öffnet den Browser auf
**http://localhost:8787/**. Beenden mit `Strg+C`.

Oberfläche, Sprachausgabe und Agent laufen über denselben Dienst und dieselbe
Adresse — es ist also nur ein Fenster offen zu halten. Der Dienst lauscht
ausschließlich auf `127.0.0.1`; aus dem Netzwerk ist er nicht erreichbar.

Beim ersten Start läuft eine kurze Startsequenz. Der Klick auf **System starten**
ist die Nutzergeste, die Audio und Sprachausgabe freischaltet — ohne sie darf
keine Website Töne abspielen.

### Ohne Schlüssel

Zeit, Datum, Timer, Erinnerungen, Aufgaben, Notizen, Rechnen, Umrechnen,
Würfeln und Witze laufen sofort — dafür braucht es nichts weiter. Wetter und
Wikipedia brauchen nur Internet. Erst KI-Modus, Agent und die eigene Stimme
brauchen Schlüssel (siehe unten).

### Von Hand starten

```bash
npm install --prefix server
node server/jarvis-proxy.mjs
```

Ein anderer Port geht mit `PORT=9000 ./start.sh`.

### Bedienung

| Aktion | Wie |
|---|---|
| Sprechen | Auf den Kern in der Mitte tippen (oder auf das Mikrofon unten links) |
| Tippen | Eingabezeile unten, `Enter` sendet |
| Schnell ins Eingabefeld | Taste `/` |
| Sprachausgabe abbrechen | `Esc`, „Stopp" oder der Stopp-Knopf |
| Sprache wechseln | DE/EN oben rechts oder „Sprich Englisch" |
| Befehlsübersicht | `?` oben rechts oder „Hilfe" |

### Wortwächter

In den Einstellungen lässt sich **Wortwächter** aktivieren. Dann hört
J.A.R.V.I.S. dauerhaft zu und reagiert nur auf Sätze, die mit „Jarvis" beginnen —
„Jarvis, wie spät ist es?". Ohne Wortwächter wird jede erkannte Äußerung
verarbeitet, solange das Mikrofon aktiv ist.

---

## Wenn etwas nicht läuft

**„Diese Seite ist nicht erreichbar" auf http://localhost:8787/**
Diese Adresse ist kein Server im Internet, sondern dein eigener Rechner. Sie
antwortet nur, solange der Dienst läuft. Im Terminal muss „J.A.R.V.I.S. läuft"
stehen. Steht dort nichts mehr, wurde er beendet — einfach neu starten.

**Das Fenster schließt sich sofort wieder (Windows)**
Dann zeigt es eine Fehlermeldung zu schnell zum Lesen. PowerShell öffnen, in den
Ordner wechseln und `.\start.bat` von dort starten — dann bleibt die Meldung stehen.

**`command not found: node`**
Node.js fehlt. Von [nodejs.org](https://nodejs.org) installieren, Version 20 oder
neuer, dann erneut starten.

**`permission denied`**
`bash start.sh` statt `./start.sh`.

**`EADDRINUSE` / „address already in use"**
Der Port ist belegt. `PORT=9000 bash start.sh`, dann
`http://localhost:9000/` öffnen.

**Die Seite lädt, aber der Agent sagt „nicht erreichbar"**
Die Adresse in den Einstellungen muss zum Port passen, auf dem der Dienst läuft.
Bei einem anderen Port dort ebenfalls anpassen.

**Der Agent antwortet, tut aber nichts**
Dann fehlt der Zugang. Der Dienst sagt es beim Start („ANTHROPIC_API_KEY fehlt")
und der Agent meldet es im Protokoll. Schlüssel in `server/.env` eintragen und
den Dienst neu starten — die Datei wird nur beim Start gelesen.

**Zum Nachsehen, was der Dienst überhaupt hat**

```bash
curl http://localhost:8787/health
```

Antwortet mit `claudeKey`, `elevenKey` und dem Arbeitsordner — damit ist klar,
welcher Schlüssel angekommen ist und welcher nicht.

## Schlüssel besorgen

Die eingebauten Befehle brauchen keinen Schlüssel. Nur drei Dinge kosten etwas:
der KI-Modus, der Agent und die eigene Stimme.

### Anthropic (KI-Modus und Agent)

1. [console.anthropic.com](https://console.anthropic.com) öffnen und anmelden.
2. Unter **Billing** Guthaben aufladen — ohne Guthaben antwortet die API nicht.
3. Unter **API keys** einen Schlüssel erzeugen (`sk-ant-…`) und sofort kopieren;
   er wird nur einmal angezeigt.

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

**Wichtig:** Ein Claude-Abo (Pro oder Max) deckt claude.ai und Claude Code ab,
**nicht** die API. API-Nutzung wird getrennt über das Guthaben in der Console
abgerechnet. Der Agent zeigt nach jedem Auftrag, was er gekostet hat, und bricht
bei 2 US-Dollar je Auftrag von selbst ab.

### ElevenLabs (eigene Stimme)

1. [elevenlabs.io](https://elevenlabs.io) öffnen und anmelden.
2. Oben rechts auf das Profilbild → **API Keys** → neuen Schlüssel erzeugen (`sk_…`).

```bash
export ELEVENLABS_API_KEY="sk_..."
```

Der kostenlose Tarif enthält ein monatliches Zeichenkontingent — zum Ausprobieren
reicht das. Ist es aufgebraucht, fällt J.A.R.V.I.S. auf die Systemstimme zurück
und sagt einmal, warum.

### Wo die Schlüssel hingehören

In `server/.env` — sonst nirgends:

```bash
cp server/.env.example server/.env
# Datei öffnen, die beiden Schlüssel eintragen
node server/jarvis-proxy.mjs
```

Der Dienst liest die Datei beim Start („Schlüssel aus … geladen."). Sie steht in
`.gitignore` und kann nicht versehentlich mit hochgeladen werden. Wer lieber
`export ANTHROPIC_API_KEY=…` benutzt, kann das weiterhin tun — gesetzte
Umgebungsvariablen haben Vorrang vor der Datei.

Die Oberfläche hat zwar Felder für die Schlüssel, aber die legen sie im
Browser-Speicher ab. Das ist nur für das eigene Gerät gedacht; über den lokalen
Dienst ist es in jedem Fall besser aufgehoben.

### Wenn ein Schlüssel doch einmal sichtbar wurde

In einen Chat kopiert, in einen Screenshot geraten, versehentlich committet —
dann gilt er als öffentlich, auch wenn die Nachricht gelöscht wird. Ein
Schlüssel lässt sich nicht zurückholen, nur ersetzen:

1. [console.anthropic.com](https://console.anthropic.com) → **API keys** → den
   betroffenen Schlüssel **löschen**. Ab dem Moment ist er wertlos.
2. Neuen Schlüssel erzeugen und in `server/.env` eintragen.
3. Unter **Usage** kurz nachsehen, ob in der Zwischenzeit etwas verbraucht wurde.

Bei ElevenLabs ist der Weg derselbe: Profil → **API Keys** → widerrufen, neu
erzeugen. Niemand — kein Dienst, kein Assistent, kein Support — braucht deinen
Schlüssel im Klartext.

## Was er kann

Alle Befehle gibt es auf Deutsch und Englisch. Die Beispiele sind Deutsch; die
englischen Entsprechungen stehen in der Hilfe in der Anwendung.

### Zeit & Termine
| Befehl | Ergebnis |
|---|---|
| „Wie spät ist es?" | Aktuelle Uhrzeit |
| „Welches Datum haben wir?" | Heutiges Datum |
| „Timer 10 Minuten" | Countdown mit Signalton und Systembenachrichtigung |
| „Erinnere mich in 1 Stunde ans Lüften" | Erinnerung mit Text |
| „Erinnere mich um 18:30 an den Anruf" | Erinnerung zur Uhrzeit (morgen, falls schon vorbei) |
| „Zeig mir die Timer" / „Timer abbrechen" | Laufende Timer anzeigen bzw. löschen |

### Listen
| Befehl | Ergebnis |
|---|---|
| „Füge Aufgabe Milch kaufen hinzu" | Aufgabe anlegen |
| „Zeig meine Aufgaben" | Liste vorlesen |
| „Aufgabe 1 erledigt" | Abhaken (per Nummer oder Stichwort) |
| „Alle Aufgaben löschen" | Liste leeren |
| „Notiere: Der Schlüssel liegt unter der Matte" | Notiz speichern |
| „Zeig meine Notizen" | Notizen vorlesen |

Aufgaben, Notizen und Timer stehen live im rechten Bereich und überleben einen
Neustart des Browsers.

### Rechnen & Umrechnen
| Befehl | Ergebnis |
|---|---|
| „Was ist 17 mal 23?" | `391` |
| „Berechne (12 + 8) / 4" | `5` |
| „Wurzel aus 144" | `12` |
| „10 km in Meilen" | `6,214 mi` |
| „20 Grad C in F" | `68 °F` |
| „100 kg in Pfund" | `200 Pfund` (deutsches Pfund = 500 g) |

Der Rechner ist ein eigener Parser (Tokenizer plus Shunting-Yard) — **kein
`eval()`**. Er kennt `+ − × ÷ ^ %`, Klammern, `sqrt`, `abs`, `round`, `floor`,
`ceil`, `sin`, `cos`, `tan`, `log`, `ln`, `exp`, `pi` und `e`, und versteht auch
gesprochene Formen wie „mal", „geteilt durch", „hoch", „Prozent von".

### Wissen & Umwelt
| Befehl | Ergebnis |
|---|---|
| „Wie ist das Wetter in Berlin?" | Wetter über [Open-Meteo](https://open-meteo.com) — ohne Schlüssel |
| „Wie ist das Wetter?" | Nutzt den Standort, sonst den zuletzt genutzten Ort |
| „Wer ist Ada Lovelace?" | Zusammenfassung aus Wikipedia (erste drei Sätze plus Link) |

### Web & System
| Befehl | Ergebnis |
|---|---|
| „Suche nach Rezepten" | Google-Suche in neuem Tab |
| „Suche Katzen auf YouTube" | Gezielte Suche (Google, YouTube, Wikipedia, Maps, GitHub) |
| „Öffne YouTube" | Bekannte Seite öffnen |
| „Systemstatus" | Zeit, Netz, Akku, Mikrofon, KI-Modus, offene Aufgaben |
| „Vollbild" / „Kopiere das" | Vollbild umschalten, letzte Antwort in die Zwischenablage |

Blockiert der Popup-Blocker das neue Fenster, liefert J.A.R.V.I.S. den Link
zum Anklicken nach — der Befehl geht nicht verloren.

### Sonstiges
„Würfle", „Wirf eine Münze", „Zufallszahl zwischen 1 und 10", „Erzähl einen
Witz", „Sprich langsamer", „Sei still", „Sprich Englisch", „Protokoll leeren".

---

## Agent — Aufträge wirklich ausführen

Ohne Agent ist J.A.R.V.I.S. eine Website: Er kann reden, rechnen und nachschlagen,
aber nichts auf dem Rechner tun. Mit Agent kann er es — Dateien anlegen, Projekte
bauen, Befehle ausführen. Dahinter steckt das Claude Agent SDK, also dieselbe
Maschinerie wie in Claude Code.

### Einschalten

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
npm install --prefix server
node server/jarvis-proxy.mjs
```

Dann Einstellungen → **Agent einschalten**, Adresse `http://localhost:8787/api/agent`.
Ab da genügt: „Baue mir eine Landingpage mit React."

### Was ihn im Zaum hält

Ein Assistent mit Zugriff auf die Konsole ist nur so gut wie seine Grenzen. Vier
greifen hier, und keine davon lässt sich aus dem Browser aufweichen:

| Grenze | Wirkung |
|---|---|
| **Arbeitsordner** | Der Agent arbeitet in `~/jarvis-workspace`, nicht im ganzen Dateisystem. Über `JARVIS_WORKSPACE` änderbar. |
| **Rückfrage** | Alles, was etwas verändert — schreiben, ausführen, installieren — landet als Frage im Protokoll und passiert erst nach einem Ja. Nur Lesen (`Read`, `Glob`, `Grep`) läuft ohne Nachfrage. |
| **Obergrenzen** | Höchstens 40 Schritte und 2 US-Dollar je Auftrag (`JARVIS_AGENT_MAX_TURNS`, `JARVIS_AGENT_BUDGET_USD`). |
| **Gesperrte Befehle** | `sudo`, `shutdown`, `reboot`, `mkfs`, `dd` und rekursives Löschen ab Wurzel sind gar nicht erst erlaubt. |

Bleibt eine Rückfrage zwei Minuten unbeantwortet, gilt sie als abgelehnt
(`JARVIS_PERMISSION_TIMEOUT_MS`). Ein laufender Auftrag lässt sich jederzeit über
**Abbrechen** stoppen.

### Freihändig arbeiten

Läuft das Mikrofon, liest J.A.R.V.I.S. die Rückfrage laut vor. Ein gesprochenes
„ja" gibt frei, „nein" lehnt ab — der ganze Ablauf funktioniert ohne Tastatur.

Damit ein verhörtes „ja" nicht versehentlich einen Auftrag startet, gehen
einzelne Wörter und Füllwörter nie an den Agenten. Sie beantworten nur eine
offene Rückfrage — oder werden nachgefragt.

### Agent oder Gespräch?

Sind Agent und KI-Modus beide an, entscheidet der Wortlaut: Aufträge („baue",
„erstelle", „installiere", „schreib", „repariere" …) gehen an den Agenten,
alles andere ins Gespräch. Das spart Zeit und Geld. Ist nur der Agent an,
bekommt er alles.

### Kosten im Blick

Jeder abgeschlossene Auftrag zeigt seine Kosten in der Kopfzeile der Karte.

## Stimme

Voreingestellt ist die ElevenLabs-Stimme **`L1aJrPa7pLJEyYlh3Ilq`**. Dafür braucht
es einen ElevenLabs-Schlüssel — ohne ihn spricht J.A.R.V.I.S. mit der
Systemstimme des Browsers weiter und sagt einmal im Protokoll, warum.

### Über den Proxy (empfohlen)

Der Schlüssel bleibt auf dem Rechner:

```bash
export ELEVENLABS_API_KEY="sk_..."
node server/jarvis-proxy.mjs
```

In den Einstellungen dann **Sprachausgabe über: ElevenLabs**, Verbindung
**Lokaler Proxy**, Adresse `http://localhost:8787/api/speak`. Mit **Stimme
testen** ist das Ergebnis sofort zu hören.

### Direkt aus dem Browser

Verbindung auf **Direkt** stellen und den Schlüssel eintragen. Er liegt dann im
`localStorage` dieses Geräts und geht direkt an `api.elevenlabs.io`. Nur für
die private Nutzung am eigenen Rechner.

### Modelle

| Modell | Wofür |
|---|---|
| `eleven_multilingual_v2` | Voreinstellung - ausgewogen, Deutsch und Englisch |
| `eleven_flash_v2_5` | niedrigste Latenz, gut für schnelles Hin und Her |
| `eleven_turbo_v2_5` | schnell bei guter Qualität |
| `eleven_v3` | ausdrucksstärkste Wiedergabe |

### Rückfall

Schlägt die Stimme zweimal fehl - falscher Schlüssel, Proxy aus, kein Guthaben -,
wechselt J.A.R.V.I.S. für diese Sitzung auf die Systemstimme, meldet den Grund
einmal im Protokoll und zeigt den Rückfall in der Systemübersicht. Ein Speichern
der Einstellungen setzt den Zähler zurück. Der Tempo-Regler wirkt auch auf die
ElevenLabs-Ausgabe.

Wer ganz ohne externen Dienst arbeiten will, stellt **Sprachausgabe über** auf
**Systemstimme des Browsers** - dann bleibt alles auf dem Gerät.

## KI-Modus (optional)

Ohne KI-Modus antwortet J.A.R.V.I.S. auf alles, was oben steht, und sagt bei
allem anderen ehrlich, dass er keinen Befehl dafür hat. Mit KI-Modus gehen freie
Fragen an die **Claude Messages API**. Es gibt zwei Wege.

### 1. Lokaler Proxy (empfohlen)

Der API-Schlüssel bleibt auf dem Rechner und taucht nie im Browser auf.

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export ELEVENLABS_API_KEY="sk_..."        # optional, für die eigene Stimme
npm install --prefix server
node server/jarvis-proxy.mjs
#   KI      -> http://localhost:8787/api/chat
#   Stimme  -> http://localhost:8787/api/speak
```

Dann in den Einstellungen **KI-Modus → Lokaler Proxy** wählen und die Adresse
eintragen. Der Proxy

- nimmt nur Anfragen von `localhost` an (per `JARVIS_ALLOWED_ORIGINS` erweiterbar),
  damit nicht jede beliebige Website das Guthaben des Schlüssels verbrauchen kann,
- begrenzt Nachrichtenzahl, Nachrichtenlänge, `max_tokens` und Anfragegröße,
- streamt die Antwort als Server-Sent-Events zurück,
- läuft mit `output_config.effort: "low"`, weil die Antworten kurz sind und
  vorgelesen werden.

`ANTHROPIC_API_KEY` ist nicht zwingend: Ohne die Variable nutzt das SDK ein
vorhandenes `ant auth login`-Profil.

### 2. Direkt aus dem Browser

Nur für die private Nutzung am eigenen Gerät. Der Schlüssel liegt dann im
`localStorage` und geht direkt an `api.anthropic.com` (mit dem Header
`anthropic-dangerous-direct-browser-access`). Wer die Seite mit anderen teilt oder
öffentlich hostet, sollte diesen Weg nicht wählen.

### Modell und Charakter

Voreingestellt ist **Claude Opus 5** (`claude-opus-5`); Sonnet 5 und Haiku 4.5
stehen ebenfalls zur Wahl. Das Feld **Charakter** überschreibt den System-Prompt —
die Voreinstellung bittet um höchstens drei Sätze ohne Markdown, weil die Antwort
vorgelesen wird. Die letzten zwölf Gesprächsschritte gehen als Kontext mit, dazu
Datum, Uhrzeit und die offenen Aufgaben.

---

## Datenschutz

| Was | Wohin |
|---|---|
| Aufgaben, Notizen, Timer, Einstellungen, Verlauf | Nur `localStorage` dieses Browsers |
| Spracherkennung | Chrome/Edge senden das Audio an den Spracherkennungsdienst des Browsers |
| Wetter | Koordinaten bzw. Ortsname an `open-meteo.com` |
| Wissensfragen | Suchbegriff an `wikipedia.org` |
| KI-Modus | Frage plus Verlauf an den eigenen Proxy bzw. `api.anthropic.com` |
| Eigene Stimme | Antworttext an den eigenen Proxy bzw. `api.elevenlabs.io` |
| Agent | Auftrag, Dateiinhalte und Befehlsausgaben an `api.anthropic.com` — der Agent liest, was er zur Arbeit braucht |

„Alles zurücksetzen" in den Einstellungen löscht sämtliche gespeicherten Daten.

---

## Browser

| Funktion | Chrome / Edge | Safari | Firefox |
|---|---|---|---|
| Oberfläche, Texteingabe, Rechner, Listen, Timer | ✅ | ✅ | ✅ |
| Sprachausgabe | ✅ | ✅ | ✅ |
| Spracherkennung | ✅ | teilweise | ❌ |

Ohne Spracherkennung sagt J.A.R.V.I.S. das beim Start und bleibt über die
Texteingabe voll benutzbar. Alle Animationen respektieren
`prefers-reduced-motion`.

---

## Eine Fähigkeit ergänzen

Fähigkeiten stehen in `jarvis.js` im Feld `SKILLS` und werden der Reihe nach
geprüft. Die erste, deren `re` passt **und** deren `run` nicht `null` liefert,
gewinnt; `null` bedeutet „passt doch nicht, weitersuchen".

```js
{
  id: 'coffee',
  re: /(kaffee|coffee)/i,
  run(match, text) {
    return isDE() ? 'Die Maschine läuft.' : 'The machine is running.';
  },
}
```

`run` darf einen String zurückgeben, ein `Promise` oder ein Objekt:

- `{ text }` — anzeigen und vorlesen
- `{ text, speak }` — anderen Text vorlesen als anzeigen (z. B. ohne Link)
- `{ text, silent: true }` — nur anzeigen, nicht vorlesen

Neue Einträge gehören vor die allgemeine `knowledge`-Fähigkeit, sonst fängt
diese die Frage vorher ab.
