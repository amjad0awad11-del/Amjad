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
| `start.sh` / `start.bat` | Ein-Befehl-Start für macOS/Linux bzw. Windows |

## J.A.R.V.I.S. — Sprachassistent

Zusätzlich zur Website liegt ein eigenständiger Sprachassistent im Projekt:
`jarvis.html`. Er versteht gesprochene und getippte Befehle — Zeit, Wetter,
Timer, Erinnerungen, Aufgaben, Notizen, Rechnen, Einheiten, Wikipedia und
Websuche —, spricht Deutsch und Englisch und läuft ohne Konto und ohne
Build-Schritt. Freie Fragen kann er optional über die Claude-API beantworten,
und für die Sprachausgabe lässt sich eine eigene ElevenLabs-Stimme hinterlegen.

Mit eingeschaltetem **Agenten** kann er außerdem wirklich etwas tun — Dateien
anlegen, Projekte bauen, Befehle ausführen —, und zwar auf Zuruf. Er arbeitet
dabei nur in einem eigenen Ordner und fragt vor jeder Änderung nach; ein
gesprochenes „ja" genügt.

```bash
./start.sh          # Windows: start.bat doppelklicken
# → http://localhost:8787/
```

Das Startskript installiert beim ersten Mal alles Nötige, legt die
Schlüsseldatei an, startet den Dienst und öffnet den Browser. Gebraucht wird nur
[Node.js](https://nodejs.org) ab Version 20.

Alle Befehle, die Einrichtung von Agent, KI-Modus und Stimme sowie die
Datenschutz-Übersicht stehen in **[JARVIS.md](JARVIS.md)**.

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
