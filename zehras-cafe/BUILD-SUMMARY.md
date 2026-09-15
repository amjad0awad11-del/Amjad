# Build summary — Zehra’s Baguette & Café

A short account of how the site is put together, what was verified, and the
decisions that are worth knowing about before changing anything.

---

## 1. Hero and video architecture

The homepage opens on a full-screen hero in which the supplied clip sits inside
a **café display window** — a tilted, cropped, warmly lit card rather than a
rectangular video player.

```
<section id="start">                    ← ScrollTrigger trigger
  <div class="hero-inner">              ← the pinned element (desktop)
    <div class="hero-layout">           ← copy | stage, side by side ≥900px
      <div class="hero-copy">           ← eyebrow, h1, lead, 2 CTAs, address
      <div class="hero-stage">          ← perspective: 1400px, container-type: size
        <div class="hero-glow">         ← warm light pooling behind the card
        <div class="hero-card">         ← transform + clip-path animate here
          <HeroVideo />                 ← <video> + poster + glass sheen + toggle
    <div class="hero-hint">             ← "Scrollen Sie weiter"
```

Two deliberate structural choices:

**All text is ordinary HTML outside the video.** The eyebrow, the three-line
claim, the supporting sentence, both buttons and the address card are in the
server-rendered markup — selectable, translatable, indexable, and readable by a
screen reader whether or not the clip ever plays.

**Depth comes from inset rings and a backdrop glow, not a drop shadow.** The
card's reveal is a `clip-path` animation, and `clip-path` clips a `box-shadow`
away too. Inset shadows paint inside the box, so they survive the whole reveal;
the sense of the card floating comes from `.hero-glow` sitting behind it.

**The card always fits.** On desktop the stage is a size container and the card
is `width: min(100cqw, 100cqh * 16/9)` — never wider than the stage, never
taller either, so a true 16:9 fits even on a short laptop screen. On mobile it
is simply `width: 100%` with `aspect-ratio: 16/9`.

### Video playback contract

| Requirement | How |
| --- | --- |
| muted, `playsInline`, `preload="metadata"` | attributes on the element; `muted` also asserted as a property before every `play()`, because React sets it as a property and autoplay policy checks the property |
| no autoplay before the hero is visible | no `autoplay` attribute; an IntersectionObserver starts playback at ≥ 35 % visibility |
| plays once, holds the last frame | no `loop` attribute; the observer will not restart a clip that has `ended` |
| pauses when far out of view | same observer, below 10 % visibility |
| no native controls by default | `controls` is off; it is switched on only after a reduced-motion guest presses play, so they get pause and seek |
| a pause mechanism exists | a discreet 44 × 44 px toggle on the card (WCAG 2.2.2) |
| poster while loading | `poster` attribute plus a designed brand still |

### Failure fallback — and a bug worth knowing about

If the clip cannot load, the card renders a static `next/image` poster with
meaningful alt text and the rest of the page is untouched.

Getting there needed a fix that is easy to get wrong. **React's `onError` does
not reliably fire for media.** The `error` event does not bubble, and with a
blocked or missing host the element already reports `error.code = 4` /
`networkState = 3` *before* React has attached its handler. Measured in a real
browser: `onError` never ran and the hero silently kept a dead `<video>`.

`HeroVideo` therefore checks `video.error` / `networkState` synchronously on
mount, attaches its own listener, re-checks after a short delay, and re-checks
again if `play()` rejects. The QA suite asserts the fallback by aborting the
video request.

---

## 2. The scroll-driven 3D opening

`gsap.matchMedia()` selects one of three behaviours and re-evaluates on resize
and on an OS preference change.

### Desktop (≥ 900 px) — pinned and scrubbed

| | start | end |
| --- | --- | --- |
| `rotateX` | 9deg | 0 |
| `rotateY` | −6deg | 0 |
| `scale` | 0.86 | 1 |
| `clip-path` | `inset(13% 19% 13% 19% round 34px)` | `inset(0% round 14px)` |
| glass sheen | 1 | 0 |
| glow | 0.85 / scale 0.96 | 0.32 / scale 1.06 |
| copy | y 0, opacity 1 | y −48, opacity 0.62 |

`scrub: 0.6`, easing `power3.out`, `transform-origin: 50% 78%` so it reads as a
window swinging open rather than a card being scaled.

**Length**: the pin runs for `+=80%` of viewport height on top of the 100 vh
view — about **180 vh total**, the upper end of the brief's range.
`pinSpacing` generates that scroll distance itself, so no section height is
hard-coded and the page cannot end up with a mismatched spacer. The visitor is
never held for more than that and flows straight into “Unsere Auswahl”.

Two implementation details that matter:

- **`fromTo`, not `to`.** Browsers normalise a computed
  `inset(13% 19% 13% 19%)` down to `inset(13% 19%)`. Reading the start value
  from the computed style would hand GSAP a different number of values to
  interpolate and the crop would jump. Both ends are stated explicitly.
- **The resting state lives in CSS, gated on `[data-hero-armed]`.** The tilt is
  painted on the very first frame, so there is no flash of the finished layout.
  The attribute is written inside a layout effect (before paint) and only when
  the timeline is actually going to be built — so with no JavaScript, a failed
  GSAP chunk, or reduced motion, the attribute never appears and the card
  renders flat, final and correct. Nobody is left looking at a half-cropped
  window.

### Mobile (< 900 px) — no pin

One soft expansion (`scale 0.93 → 1`, a gentler crop, `power4.out`, 1.1 s) as
the card enters the viewport. **No rotation** — it costs clarity at that size
for no gain. Nothing is pinned, nothing needs to be interacted with, and the
visitor scrolls on unimpeded. Verified by recording 48 distinct transform
frames in-page.

### Reduced motion

No timeline is built at all. The card is never armed, `reveal-ready` is never
added, the video does not autoplay, and all copy, address and CTAs are fully
visible. A play button is offered for anyone who does want the clip.

---

## 3. Accessibility

- Semantic landmarks (`header`, `main`, `footer`, labelled `nav`), one `h1`, and
  a heading outline that never skips a level (verified: `1,2,2,3,3,3,3,2,2,2,3,3,2,2,2`).
- Skip link is the first tab stop.
- **Mobile drawer**: `role="dialog"` + `aria-modal` applied *only while open* —
  a permanently present modal dialog is announced by assistive tech even when
  nothing is showing. Focus moves to the close button, Tab is trapped, Escape
  closes, focus returns to the toggle, body scroll is locked and released.
- **Gallery lightbox**: same pattern, plus arrow-key navigation, a politely
  announced “Bild 3 von 8” counter, and focus returning to the exact thumbnail
  that opened it.
- Icon-only controls carry `aria-label`; decorative icons and repeated wordmarks
  are `aria-hidden`.
- Every hover affordance has a `:focus-visible` equivalent — no hover-only
  functionality.
- Focus rings are visible on light and dark grounds (the ring flips to a light
  tone inside `.on-dark`).
- Interactive targets are ≥ 44 × 44 px.
- Pinch-zoom is not blocked (`maximumScale: 5`).
- Contrast is checked, not assumed. Body text ≥ 4.5:1 everywhere; the numbers
  are recorded in `globals.css`. Note that `--caramel` reaches only **2.81:1**
  on cream and is therefore restricted to non-text decoration on light grounds —
  `--caramel-deep` (5.33:1) is the text tone. That distinction is the reason
  there are two caramels and two sages.
- Content survives failure: the reveal engine only hands the hidden state to CSS
  *after* confirming it is running, so no script failure can leave a section
  blank.

---

## 4. Mobile strategy

Mobile-first, and mobile is not a reduced version of the desktop page:

- Hero copy at a scale that fits a 375 px screen without the claim wrapping
  awkwardly; the whole hero sits in `100svh` (not `vh`, so the dynamic URL bar
  cannot push the buttons below the fold).
- The header keeps only the wordmark and the menu button; the “Route planen”
  CTA lives inside the drawer, at full width, where there is room for it.
- No pinned scroll sequence, no rotation, no long animation.
- Single-column sections; the gallery keeps a two-column editorial rhythm with
  wide tiles spanning both.
- Large touch targets, a proper drawer instead of a cramped inline menu.
- Verified at 375 / 768 / 1280 / 1920 with zero horizontal overflow.

---

## 5. Performance

- All routes are **statically prerendered**; there is no server work at request
  time.
- **Fonts**: two self-hosted variable woff2 files, `latin` subset only
  (Fraunces 36 KB, Inter 48 KB), preloaded, with fallback metrics overridden so
  the swap does not shift the layout. No Google Fonts request at all.
- **Images**: AVIF first then WebP, a trimmed `deviceSizes` ladder, explicit
  `sizes` per context, aspect ratios reserved on every media box, the hero
  poster `priority`, everything below the fold lazy (12 of 14 on the homepage).
- **Video**: `preload="metadata"` only; the file itself is not fetched until the
  hero is in view, and playback stops when it is not.
- **Motion**: only `opacity`, `transform` and `clip-path` are animated — never a
  layout property. One `ScrollTrigger.batch` covers all 31 reveals rather than
  31 separate triggers.
- **No second 3D scene.** There is no WebGL anywhere; the whole effect is CSS
  perspective and transforms around the supplied clip, as the brief requires.
- `turbopack.root` is pinned to this folder so the build does not walk up into
  the rest of the repository.

---

## 6. Verified data vs. editable placeholders

**The Google Maps listing could not be opened from this build environment** —
`www.google.de` is blocked by the network egress policy, as are the directory
sites tried as alternatives. So the listing was *not* read first-hand, and
nothing was filled in from memory or inference.

**Confirmed** (from the brief, which names the listing as the source of truth):

- Name: Zehra’s Baguette & Café
- Address: Oberwallstraße 55, 47441 Moers, Deutschland
- Coordinates: 51.4507881, 6.6275451 (from the supplied URL)
- Category: café — freshly filled baguettes, cakes, drinks
- Offer: freshly filled baguettes · homemade cakes and cheesecake · fresh
  salads · latte macchiato and cappuccino · matcha · hot and cold drinks
- The Google Maps listing URL itself

**Not confirmed, therefore not invented** — telephone, website, opening hours,
rating, review count, review text, social profiles, amenities, prices, photos.
Each is a marked placeholder in `src/content/cafe.ts`, each has a defined
graceful behaviour, and all eleven are listed in `pendingConfirmation` and in
the README's pre-launch table.

Consequences visible on the site today:

- “Gästestimmen” is **not rendered at all** — no empty heading, no skeleton, and
  above all no fabricated testimonial.
- Opening hours show an honest pointer to the Google listing.
- The phone row is absent.
- The structured data contains no `aggregateRating`, `telephone`,
  `openingHoursSpecification`, `priceRange` or `menu`.
- The social section says plainly that the channels will be linked once
  confirmed.
- “Frühstück Moers” appears only in the SEO keywords; the visible copy promises
  no breakfast, because that was not confirmed.

**Imagery**: no Google Maps guest photo, Maps screenshot, map tile, Street View
frame or reviewer avatar is used — none of them are licensed for reuse on the
café's own site. The “Besuch uns” location card is an abstract branded
illustration, not a map. All 16 images are generated brand placeholders at final
dimensions.

---

## 7. Verification performed

`npm run qa` — 103 automated checks in a real Chromium, **all passing**:

- Responsive at 375 / 768 / 1280 / 1920: no horizontal overflow, no console
  errors, no console warnings, no failed requests
- Hero opening at every width: starts tilted in 3D and cropped, ends
  front-facing and uncropped; mobile animates without rotation
- Video: every required attribute, starts when visible, pauses when not
- Video failure: poster fallback, hero copy, nav, menu cards and visit section
  all intact
- Reduced motion: nothing armed, no autoplay, all content visible, opt-in play
  works and then exposes controls
- Keyboard: skip link first, drawer and lightbox focus/Escape/arrows/restoration
- Structure: landmarks, one `h1`, no skipped heading levels, all images have
  alt, lazy loading, optimiser in use
- Structured data: parses, correct type and address, and omits every unverified
  field
- “Route planen” resolves to the supplied Google listing, `target="_blank"`,
  `rel="noopener noreferrer"`
- Touch targets ≥ 44 px, no English UI labels or lorem ipsum

Also run: `npm run lint` and `npm run typecheck` clean, `npm run build` clean.

### Bugs found by this verification and fixed

1. **Primary buttons rendered with invisible text.** This file's custom CSS was
   unlayered, and unlayered rules beat every `@layer utilities` rule regardless
   of specificity — so `a { color: inherit }` overrode `text-[var(--on-dark)]`
   on every button. Fixed by moving element resets into `@layer base` and the
   project's own classes into `@layer components`. There is a warning about
   this at the top of `globals.css`.
2. **`onError` never fired for the failed video** (see §1) — the hero kept a
   dead element instead of falling back.
3. **Deep links landed in the wrong place.** `…/#besuch` ended up at y ≈ 95
   instead of y ≈ 6076, because the browser performs its fragment jump during
   parsing and the document then grows by an 80 vh pin spacer. Fixed by
   re-acquiring the target after layout settles. The same fix covers a reload
   that restores a scroll position: anything already scrolled past is revealed
   instantly, so content above the viewport can never be stuck at `opacity: 0`.
4. **The header CTA appeared at 375 px** despite `hidden sm:inline-flex` — plain
   utilities are resolved by their order in the generated stylesheet, not the
   order in the class attribute, and the Button's own `inline-flex` came later.
   Fixed by toggling a wrapper.
5. **An invalid GSAP default** (`force3D` in `gsap.defaults()`) logged a console
   warning on every page load.
6. The header wordmark link was 40.4 px tall, below the 44 px floor; the
   wordmark also wrapped to three lines at 375 px.
