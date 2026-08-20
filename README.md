# AMW — Performance Marketing & Social Media Ads

Website für die Marke **AMW**, eine Performance-Marketing- und Social-Media-Ads-Agentur.
Dunkles, futuristisches „Neon"-Design, vollständig auf **Deutsch**, mit umfangreichen
Animationen und Interaktionen. Aufgebaut als schlanke, statische Website ohne
Build-Schritt — einfach ausliefern.

## Inhalt

| Datei | Zweck |
|-------|-------|
| `index.html` | Startseite (Hero, Leistungen, Prozess, Ergebnisse, Stimmen, Über uns, FAQ, Kontakt, Footer) |
| `styles.css` | Design-System & alle Animationen (Dark-Neon-Look) |
| `script.js` | Interaktionen: Preloader, Scroll-Reveal, Count-up, Custom-Cursor, Magnet-Buttons, Tilt, Parallax, Mobile-Menü, FAQ, Formular |
| `impressum.html` | Impressum (Vorlage) |
| `datenschutz.html` | Datenschutzerklärung (Vorlage) |
| `assets/img/work-01…15.svg` | 15 Platzhalter-Bilder für die Galerie „Arbeiten" |
| `jarvis.html` | J.A.R.V.I.S. — Sprachassistent (eigenständige Seite) |
| `jarvis.css` | Oberfläche des Assistenten (HUD-Look) |
| `jarvis.js` | Assistent: Spracherkennung, Sprachausgabe, Befehle, KI-Modus |
| `server/jarvis-proxy.mjs` | Lokaler Dienst: Claude-Proxy, Sprachausgabe, Agent |
| `server/agent.mjs` | Agent-Logik: Arbeitsordner, Rückfragen, Obergrenzen |
| `server/.env.example` | Vorlage für die Schlüssel — Kopie als `server/.env` |
| `install.sh` / `install.ps1` | Einzeiler-Installation für macOS/Linux bzw. Windows |
| `start.sh` / `START-WINDOWS.bat` | Späterer Start, wenn schon installiert |

## J.A.R.V.I.S. — voice assistant

Alongside the website, the project contains a standalone voice assistant:
`jarvis.html`. It understands spoken and typed commands — time, weather, timers,
reminders, tasks, notes, arithmetic, units, Wikipedia and web search — speaks
English and German, and runs with no account and no build step. Open questions
can optionally go to the Claude API, and a custom ElevenLabs voice can be used
for speech output. (This section is in English because the assistant itself is;
the rest of this file documents the German website.)

With the **agent** switched on it can also actually do things — create files,
build projects, run commands — on request. It works only inside a folder of its
own and asks before every change; a spoken "yes" is enough.

**Files** can go along with what you say: attach a photo, a video or a document
with the paperclip, by dragging it onto the window, or by pasting it. Photos go
to Claude to be looked at; every file lands in the agent's working folder so it
can be worked on.

**Connectors** extend the agent's reach beyond that folder — a folder on your
disk, a real browser, a memory that survives a restart. Each connector's tools
still ask before they are used.

**Windows** (open PowerShell and paste):

```powershell
irm https://raw.githubusercontent.com/amjad0awad11-del/Amjad/refs/heads/claude/jarvis-assistant-2428an/install.ps1 | iex
```

**macOS / Linux** (Terminal):

```bash
curl -fsSL https://raw.githubusercontent.com/amjad0awad11-del/Amjad/refs/heads/claude/jarvis-assistant-2428an/install.sh | bash
```

One command: it fetches the project into `~/jarvis`, installs what it needs,
starts the service and opens the browser at **http://localhost:8787/**. To start
it again later, use `START-WINDOWS.bat` or `./start.sh` in the `jarvis` folder.

Every command, the setup for the agent, AI mode, files, connectors and the voice,
and the privacy overview are in **[JARVIS.md](JARVIS.md)**.

## Marke & Kontakt

- **Name:** AMW
- **Domain:** amwagence.de
- **E-Mail:** info@amwagence.de

## Animationen & Interaktionen

- Animierter Preloader mit Ladebalken
- Gradient-„Orbs" mit Parallax + animiertes Hintergrundraster
- Scroll-Reveal (IntersectionObserver) mit gestaffelten Grids
- Count-up-Statistiken (deutsche Zahlenformatierung)
- Zeilenweise Hero-Textenthüllung
- Custom-Cursor mit Follow-Effekt + Hover-States
- Magnetische Buttons & 3D-Tilt auf Karten
- Cursor-Glow auf Service-Karten
- Endlos-Marquee der Referenz-Marken
- Prozess-Fortschrittslinie, animierte Ergebnis-Balken
- FAQ-Akkordeon, Scroll-Fortschrittsleiste, aktive Navigation
- Galerie „Arbeiten" mit Hover-Zoom und Lightbox (Pfeiltasten, Zähler)
- „Showreel" mit professionellen Canvas-Animationen in Echtzeit (Liquid-
  Gradient, Partikel-Netzwerk, fließende Ribbons, treibende Bokeh) — pausieren
  automatisch außerhalb des Viewports; Video-Modal spielt echte Clips ab
- Mobiles Fullscreen-Menü mit gestaffelter Einblendung

Alle Animationen respektieren `prefers-reduced-motion`.

## Lokal ansehen

Da es sich um statisches HTML/CSS/JS handelt, genügt ein einfacher Static-Server:

```bash
# Variante 1
python3 -m http.server 8000

# Variante 2
npx serve .
```

Dann `http://localhost:8000` im Browser öffnen.

## Bilder & Videos (Platzhalter)

Die 15 Galerie-Bilder und 4 Showreel-Videos sind **selbst generierte,
markenkonforme SVG-Platzhalter** — die echten Fotos/Videos konnten in dieser
Umgebung nicht abgerufen werden. Der Austausch ist bewusst simpel gehalten:

- **Bilder:** Dateien in `assets/img/` durch echte Fotos ersetzen. Am einfachsten
  gleiche Dateinamen verwenden (`work-01.jpg` …) und die `src`-Endungen in
  `index.html` von `.svg` auf `.jpg`/`.webp` anpassen.
- **Videos/Showreel:** Die Kacheln zeigen live gerenderte Canvas-Animationen als
  professionelle Platzhalter. Für echte Clips (z. B. `.mp4`) die Datei in
  `assets/video/` ablegen und bei der jeweiligen `.reel`-Kachel in `index.html`
  das Attribut `data-video-src="assets/video/reel-01.mp4"` setzen — das Modal
  spielt dann den echten Clip statt der Animation.

## Vor dem Livegang anpassen

- **Bilder/Videos:** die o. g. Platzhalter durch echtes Material ersetzen.
- **Impressum & Datenschutz:** Platzhalter (Firmierung, Anschrift, Vertretung,
  Registerdaten, USt-IdNr., eingesetzte Tools) durch echte, rechtsverbindliche
  Angaben ersetzen.
- **Kontaktformular:** aktuell reine Frontend-Demo. Für echten Versand ein Backend
  bzw. einen Formular-Dienst anbinden (Endpoint in `script.js` / `initForm`).
- **Social-Links & Referenzen:** Platzhalter-Marken und `#`-Links durch echte ersetzen.
- **Schriften:** Space Grotesk & Inter werden via Google Fonts geladen (bei Bedarf
  lokal einbinden, z. B. aus DSGVO-Gründen).
