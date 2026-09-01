# Alora — Storefront (zwei eigenständige HTML-Dateien)

`index.html` (Startseite) und `produkt.html` (Produktseite). Reines HTML/CSS/JS,
kein Build, kein Framework, kein Bundler. Einfach im Browser öffnen — beide
Dateien liegen nebeneinander, die Links untereinander sind relativ.

| Datei | Inhalt |
|---|---|
| `index.html` | Ankündigungsleiste, Header, Hero, Marquee, Problem, Mechanik (gepinnt), Botanicals, Ritual, Vergleich, Bewertungen, FAQ, CTA, Footer |
| `produkt.html` | Header, Breadcrumb, Galerie + Buy-Box, Trust-Leiste, Inhaltsstoffe, Anwendung, Bewertungen, FAQ, Footer, Sticky-Kaufleiste |
| `assets/*.svg` | Quelldateien der Platzhalter-Grafiken (siehe unten) |

Externe Requests: nur Google Fonts (beide Seiten) und GSAP 3.12.5 + ScrollTrigger
von cdnjs (nur `index.html`). Kein `localStorage`, keine Cookies, kein Tracking.
Fällt GSAP aus, rendert die Startseite statisch weiter — alle drei Mechanik-Schritte
werden dann sichtbar geschaltet, statt gedimmt stehen zu bleiben.

## Bilder austauschen

Die Spezifikation sieht drei Fotos vor. Da keine vorlagen, stehen aktuell
selbst gezeichnete Vektor-Platzhalter im gleichen Farbklang **als
`data:image/svg+xml;base64,…` direkt im Markup** — dadurch bleiben beide Dateien
vollständig eigenständig und offline lauffähig.

| Platzhalter der Spec | Vorkommen | Datei jetzt |
|---|---|---|
| `{{BOTTLE_HERO}}` | `#heroBottle`, Galerie-Slide 1 | `assets/bottle.svg` |
| `{{BOTTLE_SM}}` | Ritual, CTA, Galerie-Slide 3, alle Thumbs | `assets/bottle.svg` |
| `{{SCENE}}` | Arch-Rahmen im Problem-Abschnitt, Galerie-Slide 2 | `assets/scene.svg` |

Die Flasche ist eine Vektorzeichnung im Seitenverhältnis 4:5 und bedient damit
`bottle_hero` (800×1000) und `bottle_sm` (416×520) gleichermaßen.

**Ersetzen:** Die echten Dateien unter *Inhalte → Dateien* in Shopify hochladen
und jedes `src="data:image/svg+xml;base64,…"` durch die `cdn.shopify.com`-URL
ersetzen — pro Motiv einmal suchen und ersetzen genügt. Alternativ die WebP-Dateien
base64-kodiert wieder als `data:`-URI einsetzen, dann bleiben die Seiten portabel.

Alle übrigen Grafiken (Pflanzen-Illustrationen, Lymphplatte, sämtliche Icons)
sind Inline-SVG im Markup — keine Icon-Fonts, keine Sprites, nichts auszutauschen.

## Zwei bekannte Schwächen aus der Vorlage

Beides steckt im wörtlich übernommenen CSS/JS der Spezifikation und ist bewusst
**nicht** eigenmächtig geändert worden. Beide Fixes sind einzeilig.

**1. Sticky-Kaufleiste erscheint nach einem Sprung nicht.**
Der Observer kennt nur eine Schwelle:

```js
var sio = new IntersectionObserver(function(es){
  es.forEach(function(e){ sticky.classList.toggle('on', !e.isIntersecting && e.boundingClientRect.top < 0); });
}, {threshold:0});
```

Springt man auf einem frisch geladenen Handy direkt an der Buy-Box vorbei
(Anker-Link, wiederhergestellte Scroll-Position), überquert `#addBtn` nie den
Viewport. Es feuert dann genau ein Callback — das beim Laden, als der Button noch
*unter* der Falz lag (`top: 1463`) — und `top < 0` wird gegen diesen veralteten
Eintrag geprüft. Die Leiste bleibt dauerhaft unsichtbar. Beim normalen Scrollen
funktioniert sie einwandfrei.
*Fix:* dieselbe Absicherung ergänzen, die die Seite für ihre Reveals ohnehin nutzt:

```js
addEventListener('scroll', function(){
  sticky.classList.toggle('on', addBtn.getBoundingClientRect().bottom < 0);
}, {passive:true});
```

**2. `produkt.html` scrollt unter 384 px Viewport-Breite seitlich.**
`.qty-row` hat eine Mindestbreite von 364 px — `.qty` ist mit `flex:none` fix
128 px breit, dazu 12 px Abstand und der Button mit 224 px Min-Content. Weil die
Spalte in `.pdp-grid` als `1fr` (also `min-width:auto`) definiert ist, kann `.buy`
nicht darunter schrumpfen: 364 px + 2 × 20 px Seitenrand = 404 px. Auf 320- und
360-px-Geräten entsteht dadurch ein horizontaler Versatz von 64 px. Ab 390 px
(iPhone 12 und neuer) ist alles unauffällig.
*Fix:* `.pdp-grid{grid-template-columns:minmax(0,1fr)}` und `#addBtn{min-width:0}` —
der Button bricht dann zweizeilig um, statt die Spalte aufzuspannen.

## Geprüft

Chromium, jeweils `index.html` und `produkt.html` bei 1920×1080, 1440×900,
1366×660, 1000×680, 768×1024, 390×844 und 320×568:

* keine Skriptfehler, alle Bilder dekodiert
* kein horizontaler Überlauf (Ausnahme: Punkt 2 oben)
* jedes `.rev`/`.split` wird sichtbar, auch nach schnellem Vorbeiscrollen
* Vergleichstabelle scrollt innerhalb ihres Kastens, nicht die Seite
* die per CSS dimensionierten Bedienelemente sind ≥ 44 px hoch
* Mechanik: Pin über `+=180 %`, Schrittwechsel bei 34 % / 70 %, Gold-Füllung,
  Stau löst sich, Knoten und Funken leuchten; der gepinnte Block passt auf einen
  Bildschirm (900 px bei 900 px Höhe)
* Pin-Gate: bei 1366×660 wird nicht gepinnt und alle drei Schritte stehen auf
  voller Deckkraft
* `prefers-reduced-motion` und komplett fehlendes GSAP: alles sichtbar und lesbar
* Buy-Box: Bundle-Wechsel, Mengenwahl (1–9), Grundpreis rechnerisch korrekt für
  alle drei Bundles, Warenkorbzähler, Galerie, Akkordeons, Sticky-Leiste
