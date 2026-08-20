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
| `assets/img/*.webp` | Galerie-Fotos „Arbeiten" (echte Beauty-/Produktkampagnen) |
| `assets/video/reel-0*.mp4` | Showreel-Videos (6 echte Clips, vertikal, H.264/AAC) |
| `assets/js/consent.js` | Consent-Banner + Meta Pixel (lädt erst nach Einwilligung) |

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

## Bilder & Videos

Die Galerie „Arbeiten" zeigt **10 echte Kampagnenmotive** (WebP, einheitlich 1080 × 1920) —
bewusst gemischt aus Studio-Produktaufnahmen und UGC-/Lifestyle-Content, damit
sich die Motive nicht ähneln: AMBRE Eau de Parfum, HOYA HYDRIA, MELVA Balm,
SERAPHINE Eye Cream, AURIVA Cream, LUMIERE Radiance Serum, VIALA Parfum-Set,
ARGILE Clay Mask, Pflegeritual und BOTANIQUE Body Balm. Die Dateien liegen in `assets/img/`.

Das „Showreel" zeigt **6 echte, vertikale Video-Clips** (`assets/video/reel-01…06.mp4`,
H.264/AAC). Die Kacheln spielen die Clips stummgeschaltet in Endlosschleife,
während sie im Sichtbereich sind (pausieren außerhalb); ein Klick öffnet den Clip
groß im Modal mit Ton und Steuerung.

> **Einheitliche Kachelgröße:** Bild- und Videokacheln werden exakt gleich groß
> dargestellt (Desktop 177 × 315 px). Die Galerie übernimmt dafür Spaltenzahl und
> Abstand des Showreels (6 / 3 / 2 Spalten). Bei 10 Motiven ist die letzte Reihe
> auf dem Desktop mit 4 Kacheln unvollständig — sie wird zentriert. Mit 12 Motiven
> (6+6) wäre das Raster auch dort vollständig gefüllt.

> **Einheitliche Maße:** Alle Galerie-Motive liegen exakt in **1080 × 1920**
> vor — dieselben Maße wie die ursprünglichen Bilder. Neue Motive vor dem
> Einbinden auf 1080 × 1920 bringen, damit das Raster einheitlich bleibt.
> (SERAPHINE und LUMIERE waren quadratisch und wurden dafür auf 9:16 beschnitten;
> Produkt und AMW-Signet bleiben jeweils vollständig erhalten.)

- **Weitere Bilder ergänzen:** Foto in `assets/img/` ablegen und in `index.html`
  in der Galerie eine weitere `.tile`-Kachel anlegen (fortlaufender
  `data-lightbox`-Index, passender `alt`-Text) — die Lightbox liest die Quellen
  automatisch aus den Kacheln.
- **Weitere Videos ergänzen:** Clip in `assets/video/` ablegen und in `index.html`
  eine weitere `.reel`-Kachel mit `<video class="reel__video" …>` und passendem
  `data-video-src` anlegen — Vorschau-Autoplay und Modal funktionieren automatisch.

## Tracking: Meta Pixel & Einwilligung

Der Meta Pixel (ID `1381478497268708`) liegt in `assets/js/consent.js` und wird
auf allen Seiten eingebunden. Er lädt **ausschließlich nach ausdrücklicher
Einwilligung** — entsprechend § 5/§ 6 der Datenschutzerklärung
(Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TTDSG).

- **Ohne Entscheidung:** Banner wird angezeigt, es wird **kein** Meta-Skript
  geladen und kein Marketing-Cookie gesetzt.
- **„Akzeptieren":** Pixel wird geladen, `PageView` wird ausgelöst, Auswahl wird
  in `localStorage` (`amw-consent`) gespeichert.
- **„Ablehnen":** Es wird nichts geladen; die Ablehnung wird gespeichert.
- **Widerruf:** `amwResetConsent()` in der Browser-Konsole aufrufen — der Banner
  erscheint erneut. Für einen Link im Footer diese Funktion anbinden.

Bewusst **ohne** `<noscript>`-Fallback: Der Bild-Pixel im `<noscript>`-Tag würde
ohne JavaScript ungefragt feuern und damit die Einwilligungspflicht umgehen.

Weitere Events (z. B. `Lead` beim Absenden des Kontaktformulars) sind derzeit
nicht eingebunden.

## Vor dem Livegang anpassen

- **Bilder/Videos:** Galerie-Fotos und Showreel-Clips sind bereits echtes Material.
- **Impressum & Datenschutz:** Platzhalter (Firmierung, Anschrift, Vertretung,
  Registerdaten, USt-IdNr., eingesetzte Tools) durch echte, rechtsverbindliche
  Angaben ersetzen.
- **Kontaktformular:** aktuell reine Frontend-Demo. Für echten Versand ein Backend
  bzw. einen Formular-Dienst anbinden (Endpoint in `script.js` / `initForm`).
- **Social-Links & Referenzen:** Platzhalter-Marken und `#`-Links durch echte ersetzen.
- **Schriften:** Space Grotesk & Inter werden via Google Fonts geladen (bei Bedarf
  lokal einbinden, z. B. aus DSGVO-Gründen).
