# AMW — Creative Performance Studio

Website für **AMW**, ein deutsches Creative- und Performance-Marketing-Studio mit
Fokus auf Meta Ads. One-Pager mit Rechtsseiten, gebaut als animationsstarke
Next.js-Anwendung.

## Stack

| Baustein | Wahl |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + eigenes Token-System in `globals.css` |
| Motion | GSAP (ScrollTrigger, Observer), Lenis, split-type |
| Schrift | selbst gehostet als woff2 via `next/font/local` |
| Formular | eigener Route Handler, kein Drittanbieter-Script |

## Loslegen

```bash
npm install
npm run dev          # Entwicklung auf http://localhost:3000
npm run build        # Produktions-Build
npm start            # Produktions-Server
npm run lint         # ESLint
npm run placeholders # Platzhalter-Assets erzeugen (--force überschreibt)
npm run qa           # Browser-QA: Konsole, 404, Überlauf, Reduced Motion
```

## Aufbau

```
src/
  app/            Routen, Layout, globals.css, API-Route, sitemap/robots
  components/
    motion/       Bewegungs-Primitive (Reveal, Marquee, Cursor, Preloader …)
    layout/       Header, Menü, Footer, Shell, Rechtsseiten-Layout
    sections/     Die Abschnitte des One-Pagers, in Reihenfolge
    ui/           Button, SectionHeader, Accordion, SmartLink
  content/de.ts   Sämtliche sichtbaren Texte
  lib/            Motion-Tokens, Hooks, Platzhalter- und Asset-Helfer
scripts/          Platzhalter-Generator, QA-Harness
```

**Regel:** In JSX steht kein sichtbarer String. Alles kommt aus `content/de.ts`.

## Texte ändern

`src/content/de.ts` bearbeiten — mehr nicht. Die Datei ist typisiert; ein
falscher Schlüssel bricht den Build, bevor er live geht.

## Noch offene Platzhalter

Alles im Format `[[TOKEN]]` steht sichtbar auf der Seite, damit es nicht
vergessen wird. Nichts davon wurde erfunden.

| Platzhalter | Was hineingehört |
|---|---|
| `[[EMAIL]]` | E-Mail-Adresse (Header-Menü, Kontakt, JSON-LD) |
| `[[INSTAGRAM_URL]]` | Instagram-Profil |
| `[[CALENDLY_URL]]` | Terminbuchung |
| `[[PREIS_CREATIVE]]`, `[[PREIS_PERFORMANCE]]`, `[[PREIS_SCALE]]` | Paketpreise |
| `[[ANZAHL]]` | Creatives pro Monat im Paket CREATIVE |
| `[[UMSATZGRENZE]]` | Aufnahmekriterium für SCALE |
| `[[MIN_BUDGET_ANTWORT]]` | FAQ-Antwort zum Mindestbudget |
| `[[KUNDE_1]]` … `[[KUNDE_6]]` | Freigegebene Kundennamen oder Anonymisierungen |
| `[[TESTIMONIAL_1..3_*]]` | Nur echte, freigegebene Zitate |
| `[[STAT_1..3_*]]` | Belegbare Zahlen — sonst Abschnitt entfernen |
| `[[IMPRESSUM_INHALT]]`, `[[DATENSCHUTZ_INHALT]]` | Rechtsverbindlicher Text |

Platzhalter werden bewusst behandelt: Links mit `[[TOKEN]]` rendern als inerter
Text statt als Route, die 404 liefert (`SmartLink`), lange Tokens rücken eine
typografische Stufe herunter, damit sie ihre Karte nicht sprengen, und Felder
mit Platzhaltern werden aus dem JSON-LD **weggelassen** statt als Tatsache
ausgeliefert.

## Bilder und Videos

`npm run placeholders` erzeugt markenkonforme Platzhalterbilder in
`public/images` und `public/media`.

**Videos werden bewusst nicht gefälscht.** Komponenten binden ein `<video>` nur
ein, wenn die Datei wirklich existiert (`src/lib/assets.ts`, Prüfung zur
Build-Zeit) — fehlt sie, greift sauber das Poster, ohne 404 und ohne
Konsolenfehler. Echte Dateien einfach unter diesen Namen ablegen, dann schalten
sich die Videos ohne Codeänderung zu:

```
public/media/hero.mp4
public/media/work-1.mp4 … work-6.mp4
public/media/leistung-1.mp4 … leistung-5.mp4
```

Zu ersetzende Bilder: `public/media/hero-poster.jpg`,
`public/images/work-1…6.jpg`, `leistung-1…5.jpg`, `studio-1…4.jpg`,
`og.jpg`.

## Kontaktformular

`src/app/api/kontakt/route.ts` validiert serverseitig, hat ein Honeypot-Feld und
eine einfache IP-Ratenbegrenzung. Der Versand ist noch nicht angebunden — der
Block ist mit `// TODO: connect email provider (Resend/SMTP)` markiert. Die
Antwortform bleibt gleich, das Formular braucht dafür keine Änderung.

Die Ratenbegrenzung liegt im Arbeitsspeicher und reicht für eine Instanz. Hinter
mehreren Instanzen oder serverless gehört dort ein gemeinsamer Speicher hin.

## Schrift

Der Entwurf nennt General Sans oder Satoshi von Fontshare. Fontshare ist aus der
Build-Umgebung nicht erreichbar (Egress-Policy), deshalb steht dort eine
selbst gehostete Variable-Grotesk gleicher Rolle. Zum Tausch die lizenzierten
woff2-Dateien unter `public/fonts/amw-display-var.woff2` ablegen — die Einbindung
in `src/app/layout.tsx` bleibt unverändert.

## Barrierefreiheit

- Sichtbarer Fokusring auf jedem Bedienelement, Sprunglink zum Inhalt.
- Menü und Showreel: Fokusfalle, `Esc`, Fokus kehrt zum Auslöser zurück.
- Akkordeon mit `aria-expanded`/`aria-controls`, Slider mit Pfeiltasten.
- Vollständiger `prefers-reduced-motion`-Pfad: kein Lenis, kein Pinning,
  kein Cursor, kein Preloader, stehendes Laufband.

**Kontrast:** Drei Vorgaben des Entwurfs erreichen 4.5:1 nicht und wurden
ersetzt — dokumentiert in `globals.css` und an der jeweiligen Stelle im Code:

| Vorgabe | gemessen | jetzt |
|---|---|---|
| `--ash` auf `--ink` | 3.80:1 | `--ash-on-dark` (5.74:1) |
| `--ash` auf `--cream` | 4.48:1 | `--ash-on-light` (4.73:1) |
| `--amber-dk` auf `--cream` | 2.48:1 | `--amber-on-light` (6.02:1) |
| Wort-Scrub ab `opacity 0.15` | 1.43:1 | ab `0.55` (5.63:1) |
| Inaktive Prozess-Schritte `opacity 0.25` | 1.43:1 | Farbwechsel statt Dimmen |

Die Rohtokens bleiben erhalten — für Rahmen, Trennlinien und große Displaytexte,
für die die 4.5:1-Regel nicht gilt.

## Messwerte

Lighthouse Desktop, Produktions-Build:

| Kategorie | Wert |
|---|---|
| Performance | 99 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| LCP | 0,7 s |
| CLS | 0,003 |

Initiales JavaScript: **211 KB gzip**, knapp über dem Ziel von 200 KB. Die
Aufteilung: React ≈ 70 KB, Next-App-Router-Runtime ≈ 46 KB, die vorgegebene
Motion-Schicht (GSAP + ScrollTrigger + Observer + Lenis) ≈ 64 KB — also rund
180 KB, bevor eine Zeile AMW-Code dazukommt. Der Rest ist Anwendungscode.

## Legacy

Die vorherige statische Website liegt unverändert unter `legacy/`.

## `index.html` — Einzeldatei-Fassung „Marken in Bewegung"

Neben der Next.js-Anwendung liegt im Repository-Wurzelverzeichnis eine
**vollständig eigenständige** Landingpage: `index.html`. Eine Datei, kein Build,
kein Framework, kein Bundler — Doppelklick genügt.

| Baustein | Umsetzung |
|---|---|
| 3D | Three.js r0.160 über Importmap von unpkg, dazu `GLTFLoader` |
| Bühne | Bronzeskulptur auf schwarzem Grund, Kamera umkreist sie beim Scrollen um 360° |
| Hintergrund | eigener Wellen-Shader, Palette wandert beim Scrollen von Bronze nach Saphirblau |
| Partikel | 450 additive Funken mit prozedural erzeugter Textur, turbulenter bei schnellem Scrollen |
| Text | vier Slides, Titel buchstabenweise mit Blur-Aufblendung (0,035 s Versatz) |
| Bedienung | eigener Doppelring-Cursor, Rasterlinien mit driftenden Punkten, Stories-Fortschritt |
| Schrift | Italiana (Display) und Outfit (Fließtext) von Google Fonts |

Die Seite ist 900 vh hoch; sämtliche Bewegung hängt an der Scrollposition und
wird per Lerp geglättet (Scroll 0.025, Maus 0.05, Cursor 0.2).

**Inhalt:** deutsch, vier Stationen — Marke, Kreation, Performance, Wachstum.

**Assets:** Modell und Editorial-Bild kommen aus dem Layers-Bucket
(`ASSET_BASE_URL` oben im Script). Lässt sich das GLB nicht laden — offline,
gesperrter Host —, tritt eine prozedural erzeugte Bronzeform an seine Stelle,
damit die Bühne nie leer bleibt.
