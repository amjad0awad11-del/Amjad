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

## Vor dem Livegang anpassen

- **Impressum & Datenschutz:** Platzhalter (Firmierung, Anschrift, Vertretung,
  Registerdaten, USt-IdNr., eingesetzte Tools) durch echte, rechtsverbindliche
  Angaben ersetzen.
- **Kontaktformular:** aktuell reine Frontend-Demo. Für echten Versand ein Backend
  bzw. einen Formular-Dienst anbinden (Endpoint in `script.js` / `initForm`).
- **Social-Links & Referenzen:** Platzhalter-Marken und `#`-Links durch echte ersetzen.
- **Schriften:** Space Grotesk & Inter werden via Google Fonts geladen (bei Bedarf
  lokal einbinden, z. B. aus DSGVO-Gründen).
