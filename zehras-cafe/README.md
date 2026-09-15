# Zehra’s Baguette & Café — Website

Customer-facing website for **Zehra’s Baguette & Café**, Oberwallstraße 55,
47441 Moers. German throughout, mobile-first, with a scroll-driven 3D hero
built around the supplied café video.

> This project lives in its own folder and is completely self-contained. It has
> its own `package.json`, its own dependencies and its own build — it does not
> share anything with other projects in this repository.

---

## 1. Installation and running

Requires **Node.js 20 or newer**.

```bash
cd zehras-cafe
npm install
npm run assets     # generates the placeholder images (first run only)
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm run start
```

| Script                 | What it does                                                        |
| ---------------------- | ------------------------------------------------------------------- |
| `npm run dev`          | Development server with hot reload                                  |
| `npm run build`        | Production build (all pages are statically prerendered)             |
| `npm run start`        | Serves the production build                                         |
| `npm run lint`         | ESLint (`eslint-config-next`)                                       |
| `npm run typecheck`    | TypeScript, no emit                                                 |
| `npm run assets`       | Writes any missing placeholder image                                |
| `npm run assets:force` | Regenerates **all** placeholder images, overwriting them            |
| `npm run qa`           | Browser test suite — see [section 7](#7-the-qa-suite)               |

### One thing to set before going live

There is no confirmed domain for the café, and none was invented. Set the real
one as an environment variable so canonical URLs, Open Graph tags, the sitemap
and the structured data all point at the right place:

```bash
NEXT_PUBLIC_SITE_URL=https://www.ihre-domain.de
```

Until it is set, everything falls back to `http://localhost:3000`.

---

## 2. Dependencies

| Package                      | Why it is here                                                   |
| ---------------------------- | ---------------------------------------------------------------- |
| `next` 16.3                  | Framework, App Router, image optimisation, metadata              |
| `react` / `react-dom` 19.2   | UI                                                               |
| `tailwindcss` 4              | Styling, driven by the design tokens in `src/app/globals.css`     |
| `gsap` (+ ScrollTrigger)     | The hero's 3D opening, scroll reveals, image parallax            |
| `lucide-react`               | Interface icons (no emoji are used as icons anywhere)            |
| `clsx`                       | Conditional class names                                          |
| `sharp` (dev)                | Generates the placeholder images                                  |
| `playwright` (dev)           | Runs the QA suite                                                 |
| `@fontsource-variable/*` (dev) | Source of the self-hosted font files                            |

### Fonts

**Fraunces** (editorial serif, headlines) and **Inter** (sans, everything else),
both OFL-licensed variable fonts, self-hosted from `src/app/fonts/` with their
licences alongside them. Nothing is fetched from a Google server at build time
or at runtime, so there is no third-party font request to disclose in the
privacy policy.

Only the `latin` subset is loaded — it already covers every character in the
German copy, including `ä ö ü ß`, the apostrophe in “Zehra’s”, the en dash and
the middot. The matching `*-latin-ext-*.woff2` files are checked in next to
them: change the path in `src/app/layout.tsx` if the menu ever needs Turkish
glyphs (`ş ğ ı`) or other extended Latin characters.

---

## 3. Editing the content — one file

**Everything a café owner needs to change lives in
[`src/content/cafe.ts`](src/content/cafe.ts).** No customer-facing text is
hard-coded in a component. The file is heavily commented; the important
convention is:

- `// BESTÄTIGT` — confirmed from the Google Maps listing. Safe.
- `// PLATZHALTER` — **not** confirmed. The value is `null` or `[]`, and the
  site *hides* that part instead of inventing something.

**Never replace a `null` with a guess.** Wrong opening hours and invented
phone numbers cost real customers. The site is fully publishable as it stands,
and gets richer as facts are confirmed.

### Opening hours

Fill the `openingHours` array. The commented-out example in the file shows the
exact shape. Closed days get `opens: null, closes: null`.

- while the array is **empty**: a short note pointing at the Google listing is
  shown, and no `openingHoursSpecification` is written into the structured data
- once it is **filled**: a proper day/time table appears and the structured data
  includes the hours

### Telephone number

```ts
phone: { display: "02841 000000", dial: "+492841000000" }
```

`display` is what guests read, `dial` must be E.164 (no spaces, leading `+`).
While it is `null` the phone row is hidden and no `telephone` is emitted.

### Menu / “Unsere Auswahl”

`auswahl.cards` — four cards, each with a title, one line of copy, an icon key
and an image. Add or remove cards freely; the grid adapts. Icon keys map to
Lucide icons in `src/components/sections/Auswahl.tsx` (`baguette`, `kuchen`,
`salat`, `kaffee`).

**No prices anywhere.** None could be confirmed, and a price that is wrong at
the counter is worse than no price at all. `auswahl.priceNote` says so politely.

### Reviews / “Gästestimmen”

Set `rating`, `reviewCount` and 3–5 short `excerpts`. Rules that must hold:

- excerpts must be **real** and quoted verbatim from the listing
- attribute each as `"Google-Bewertung"` — no author names
- never add avatars or reviewer profile pictures

The section renders as soon as `excerpts` has one entry. The star badge appears
only when *both* `rating` and `reviewCount` are set. While `excerpts` is empty
the entire section is not rendered at all — and the
“Weitere Bewertungen auf Google ansehen” button still exists in
“Besuch uns”, so that link is never lost.

### Social media

Add confirmed profiles to `socialLinks`:

```ts
{ platform: "instagram", label: "@…", href: "https://www.instagram.com/…" }
```

They then appear in the social section, the footer, and as `sameAs` in the
structured data. Posts are deliberately **not** embedded or scraped — that needs
the café's own approval and a supported integration, and it would pull
third-party tracking onto the page.

### Legal pages

`legal.impressum` and `legal.datenschutz` contain `[[MARKER]]` placeholders.
Both pages are set to `noindex` while those markers remain. **Have the finished
text checked by a lawyer**, then remove the `robots` override in
`src/app/impressum/page.tsx` and `src/app/datenschutz/page.tsx`.

---

## 4. Replacing the images

All imagery currently in `public/images/` is a **branded placeholder** generated
by `npm run assets`. Each one is already at its final dimensions, so dropping a
real photo in its place changes the pixels and nothing else — no layout shift,
no code change.

**Keep the same filename and the same pixel dimensions**, then delete nothing
else. JPEG or PNG both work; Next.js converts to AVIF/WebP and generates the
responsive sizes automatically.

| File                         | Size        | Subject                       |
| ---------------------------- | ----------- | ----------------------------- |
| `hero-poster.jpg`            | 1920 × 1080 | Hero poster / video first frame |
| `og.jpg`                     | 1200 × 630  | Social sharing card           |
| `cafe-atmosphaere.jpg`       | 1400 × 1750 | Café atmosphere (portrait)    |
| `ueber-uns-theke.jpg`        | 1400 × 1050 | Counter / team                |
| `auswahl-baguettes.jpg`      | 1200 × 900  | Filled baguettes             |
| `auswahl-kuchen.jpg`         | 1200 × 900  | Homemade cake                 |
| `auswahl-salate.jpg`         | 1200 × 900  | Fresh salads                  |
| `auswahl-getraenke.jpg`      | 1200 × 900  | Coffee / matcha               |
| `galerie-baguette-01.jpg`    | 1600 × 1200 | Gallery, wide                 |
| `galerie-kuchen-01.jpg`      | 1200 × 1500 | Gallery, portrait             |
| `galerie-kaffee-01.jpg`      | 1200 × 1200 | Gallery, square               |
| `galerie-matcha-01.jpg`      | 1200 × 1500 | Gallery, portrait             |
| `galerie-kuchen-02.jpg`      | 1600 × 1200 | Gallery, wide                 |
| `galerie-theke-01.jpg`       | 1200 × 1200 | Gallery, square               |
| `galerie-innenraum-01.jpg`   | 1200 × 1500 | Gallery, portrait             |
| `galerie-aussen-01.jpg`      | 1600 × 1200 | Exterior, wide                |

If you change a size, or add an image, update the matching entry in
`src/content/cafe.ts` (`width` / `height`) and the manifest in
`scripts/generate-assets.mjs`. The script cross-checks the two and warns if an
image referenced in the content file has no generator entry.

**Alt texts** live in `src/content/cafe.ts` next to each image and are read
aloud by screen readers — please improve them to describe the real photo.

### What must NOT be used as source material

Google Maps guest photos, Google Maps screenshots, map tiles, Street View
imagery and reviewer avatars are **not** licensed for reuse on your own
website, and none of them are used here. Use the café's own photography, or
images you have bought a licence for.

### The hero video

The single supplied clip is referenced by URL in `heroVideo.src`. See
[`public/media/README.md`](public/media/README.md) for how to move it onto your
own domain (recommended: better privacy, better load time, one fewer
third-party dependency) and how to grab a real poster frame from it.

---

## 5. Project structure

```
src/
  app/
    layout.tsx          Fonts, German metadata, Open Graph
    page.tsx            Homepage composition
    globals.css         Design tokens + cascade layers  ← read the header comment
    fonts/              Self-hosted woff2 + licences
    impressum/          Legal page (noindex while placeholders remain)
    datenschutz/        Legal page (noindex while placeholders remain)
    sitemap.ts robots.ts icon.svg not-found.tsx
  content/
    cafe.ts             ★ ALL editable content
  components/
    hero/               Hero + the video card
    sections/           The eight page sections, gallery lightbox, location card
    layout/             Header (with mobile drawer), footer, wordmark
    motion/             Scroll reveals, image parallax
    ui/                 Button, section header
    JsonLd.tsx          LocalBusiness structured data
  lib/                  GSAP setup, reduced-motion hook, helpers
scripts/
  generate-assets.mjs   Placeholder image generator
  qa.mjs                Browser test suite
```

### Replacing the wordmark with a real logo

`src/components/layout/Wordmark.tsx` is a typographic lockup. The file's header
comment shows the three-line change to swap in an image or SVG; nothing else in
the project touches the individual type layers.

---

## 6. Before you publish — open points

Every item below is unconfirmed on purpose. The site works without all of them;
each one you confirm makes it better. The same list is machine-readable as
`pendingConfirmation` in `src/content/cafe.ts`.

| # | To confirm | What the site does meanwhile |
| - | ---------- | ---------------------------- |
| 1 | **Domain** (`NEXT_PUBLIC_SITE_URL`) | Canonical/OG/JSON-LD point at `localhost`. **Must be set.** |
| 2 | **Opening hours** | Note pointing at the Google listing; no hours in structured data |
| 3 | **Telephone number** | Phone row hidden; no `telephone` in structured data |
| 4 | **Google rating, review count, review quotes** | Whole “Gästestimmen” section not rendered; no `aggregateRating` |
| 5 | **Instagram / other profiles** | Social section shows a note and links the Google listing |
| 6 | **Real photos** | Branded placeholders at final dimensions |
| 7 | **Hero poster frame** | A designed brand still is used |
| 8 | **Video hosting** | Loaded from the supplied external URL |
| 9 | **Impressum + Datenschutz** | Pages exist with `[[…]]` markers, set to `noindex` |
| 10 | **Breakfast offering** | “Frühstück Moers” is only an SEO keyword; nothing is promised in the visible text |
| 11 | **Amenities** (outdoor seating, accessibility, payment) | No claims made at all |

### What *is* confirmed

Taken from the Google Maps listing supplied in the brief: the business name, the
full address, the coordinates, the business category, and the offer — freshly
filled baguettes, homemade cakes and cheesecake, fresh salads, latte macchiato
and cappuccino, matcha, hot and cold drinks. Everything visible on the site is
built from exactly that.

---

## 7. The QA suite

`npm run qa` drives the real site in Chromium and runs 103 checks: responsive
behaviour at 375 / 768 / 1280 / 1920, the hero opening at each width, video
configuration and playback, the video-failure fallback, reduced motion, the
keyboard paths through the mobile drawer and the gallery lightbox, heading
structure, landmarks, alt texts, touch-target sizes, the structured data, and
that the “Route planen” button really opens the supplied Google listing.

```bash
npm run build
npm run start &                     # or: npm run dev
QA_BASE_URL=http://localhost:3000 npm run qa
```

Screenshots land in `qa-screenshots/` (git-ignored). Run it after swapping in
real photos — it will catch a wrong image size or a missing alt text.

---

## 8. Accessibility and performance notes

- **Reduced motion**: with `prefers-reduced-motion: reduce` no scroll-driven
  transform, rotation, mask or reveal is built at all, the hero renders in its
  final flat layout, and the video does not autoplay — a play button is offered
  instead, which then exposes native controls.
- **Without JavaScript** the page is complete: the hidden state for reveals is
  only applied once the reveal engine has confirmed it is running, so a failed
  script can never leave a section invisible.
- **Without the video** the hero falls back to a static poster and every other
  part of the page keeps working.
- Full keyboard support, visible focus rings on both light and dark grounds,
  focus trapping and restoration in the drawer and the lightbox, Escape to
  close, arrow keys in the gallery.
- Colour pairings are contrast-checked; the numbers are in the comments in
  `globals.css`. Body text is ≥ 4.5:1 everywhere.
- Interactive targets are at least 44 × 44 px.
- Images are AVIF/WebP with responsive sizes, below-the-fold images are lazy,
  and every media box reserves its aspect ratio so nothing shifts while loading.
