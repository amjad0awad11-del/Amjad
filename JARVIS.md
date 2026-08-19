# J.A.R.V.I.S. — Sprachassistent im Browser

Ein vollständiger Sprachassistent als statische Seite: `jarvis.html`, `jarvis.css`,
`jarvis.js`. Kein Build-Schritt, keine Abhängigkeiten, kein Konto nötig. Die
meisten Befehle laufen komplett auf dem Gerät; nur Wetter, Wikipedia und der
optionale KI-Modus brauchen Internet.

---

## Starten

Das Mikrofon geben Browser nur auf `https://` oder `http://localhost` frei — ein
Doppelklick auf die Datei (`file://`) reicht für die Texteingabe, nicht für die
Spracherkennung.

```bash
python3 -m http.server 8000
# dann http://localhost:8000/jarvis.html öffnen
```

Beim ersten Start läuft eine kurze Startsequenz. Der Klick auf **System starten**
ist die Nutzergeste, die Audio und Sprachausgabe freischaltet — ohne sie darf
keine Website Töne abspielen.

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

## KI-Modus (optional)

Ohne KI-Modus antwortet J.A.R.V.I.S. auf alles, was oben steht, und sagt bei
allem anderen ehrlich, dass er keinen Befehl dafür hat. Mit KI-Modus gehen freie
Fragen an die **Claude Messages API**. Es gibt zwei Wege.

### 1. Lokaler Proxy (empfohlen)

Der API-Schlüssel bleibt auf dem Rechner und taucht nie im Browser auf.

```bash
export ANTHROPIC_API_KEY="sk-ant-…"
npm install --prefix server
node server/jarvis-proxy.mjs
# → J.A.R.V.I.S. proxy → http://localhost:8787/api/chat
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
