# pdp-scroll-reveal — rationale

Built without brand input: `memory/brand.md` has no colours, type or voice yet, and
`memory/competitors.md` has no competitors configured, so there is no finding to react to.
Rather than file an empty daily report, this is a brand-agnostic pattern proposal — grayscale
placeholders throughout, clearly labeled, easy to re-skin once brand.md is filled in (swap the
CSS custom properties at the top of `style.css` and the two font-family lines; nothing in the
markup or animation logic is brand-specific).

## Purpose test, applied per section

- **Hero load-in stagger.** Headline → subhead → CTA fade up in sequence, 150ms apart.
  Establishes reading order on first paint. Three elements, fires once. Cut candidate if
  Amjad wants zero motion above the fold — it's cheap but not load-bearing.
- **Pinned product reveal (the actual demo).** The product stays fixed on screen while four
  feature callouts appear one at a time as the user scrolls. This is the pattern worth
  showing: it turns "read four paragraphs of spec copy" into "notice four things in
  sequence," and it answers a real question — what does this product actually have — one
  detail at a time instead of all at once. This only works if the section is short enough
  that it doesn't feel like scroll-jacking; at 320vh of scroll distance for four callouts it
  costs roughly two and a half screens of extra scrolling, which is on the edge of what I'd
  ship without user testing. If Amjad wants fewer callouts (3) or a shorter scroll multiplier
  (250vh), that's a one-line change in `style.css` (`.reveal { height }`) and the timeline
  offsets in `script.js`.
- **Related-products stagger.** One-shot, 80ms apart, fires once (`ScrollTrigger.batch`,
  `once: true`). Reads as "this is a set" rather than four cards popping in independently.
  Does not re-trigger on scroll-back, so it never fights someone re-reading the page.

**Cut, not included:** parallax on the hero background, scroll-scrubbed image sequences,
cursor-follow effects. None of them served comprehension here — they were candidates only
because they're common on moodboards, which is exactly the standard this brief says to
reject.

## Timing choices

- **220–500ms, `power2.out`** for every discrete reveal (hero stagger, callout entrance,
  grid stagger). Fast enough to read as responsive, eased enough not to look mechanical.
  `power2.out` decelerates into the resting state, which reads as "arriving" rather than
  "stopping" — matters more than it sounds for four callouts landing in different screen
  positions.
- **`scrub: 1`** (not `scrub: true`) on the pinned timeline. A 1-second smoothing lag between
  scroll position and animation position so fast scroll-flicks don't snap the callouts in and
  out instantly — without it the reveal feels twitchy on a trackpad fling.
- **No Lenis.** Native scroll is enough to drive `ScrollTrigger`'s scrub and pin here; Lenis
  hijacks the scrollbar and changes feel everywhere on the page, which is a cost this single
  section doesn't justify. Left out, not forgotten.

## Reduced motion — a real variant, not a disabled one

`prefers-reduced-motion: reduce` removes the pin entirely (no scroll-jacking) and switches
`.reveal-pin`/`.callouts` to normal stacked document flow via CSS (mirrored in both a
`.no-motion` body class and a bare `@media` block, so the layout is correct even before
`script.js` runs, or if it never runs at all). The only motion left is a 120ms opacity-only
cross-fade per callout/card as it enters the viewport via `IntersectionObserver` — same four
features, same order, same copy, delivered without scrubbing or pinning the scrollbar. This
is the "instant state change / cross-fade with meaning preserved" variant the brief asks for,
not `animation: none` on the same layout.

## Non-negotiables, checked

- Every tween animates `opacity`/`transform` (`scale`, `y`) only. Nothing touches `width`,
  `height`, `top`, `left`, or layout-triggering properties as an animated value — the only
  place `height` changes is in the `.no-motion`/`@media` CSS overrides, and those are static
  layout switches, not animations.
- No CLS: base CSS renders every element in its final, laid-out position and size at full
  opacity. JS only sets a hidden "from" state immediately before it can also run the
  animation that restores it — see the comment at the top of `script.js`. If GSAP fails to
  load from the CDN, the page is fully readable with zero motion.
- `will-change: transform, opacity` is set only on the pinned region's elements
  (`onEnter`/`onEnterBack`) and the current grid batch (`onEnter` of the batch), and cleared
  (`onLeave`/`onLeaveBack`, `onComplete`) the moment it's no longer active. Nothing carries a
  permanent `will-change`.
- Reduced motion: see above — a real alternative layout and a real (shorter, transform-free)
  animation, not a flag that turns animation off on an unchanged layout.
- Cleanup: this is a static page with no component lifecycle, so there's no unmount to hook
  into. `script.js` kills all `ScrollTrigger` instances on `beforeunload` as a demonstration
  of the pattern, and the comment directly above it spells out the `gsap.context()` /
  `ctx.revert()` shape this needs to take the moment it's ported into a real
  React/Vue/whatever route — that port is YELLOW (touches Amjad's repo) and out of scope
  here.

## What I measured

No real browser available in this environment, so I did not get a DevTools Performance trace
or a logged frame-timing sample from an actual render. What I did do:

1. Read every tween and confirmed each one only ever animates `transform`/`opacity`
   properties — no layout or paint-triggering properties in any `gsap.to`/`gsap.set` call.
2. Kept the pinned timeline to five scrubbed tweens (visual + 4 callouts) and one one-shot
   batched stagger of four cards — deliberately low element/tween count so there's headroom
   even on a mid-range phone; nothing here is close to the kind of tween count that tends to
   drop frames.
3. Served the page locally (`python3 -m http.server 8080`) and confirmed the HTML/CSS/JS
   load without console errors and that the DOM structure resolves as expected (see below).
4. Left a real verification tool in the page: append `?debug=1` to the URL for a live rolling
   1-second FPS counter (top-right badge, `requestAnimationFrame`-driven, ~0-cost — it only
   writes `textContent` once a second). **Amjad: run it with `?debug=1` and scroll through the
   pinned section — that number is the actual verification, not my say-so.**

If it drops below 60fps on his hardware, the first thing to try is dropping `scrub: 1` to a
smaller lag or reducing the callout count to three before touching anything else.

## Files

- `index.html` — structure, all copy in `[brackets]` as placeholder labels.
- `style.css` — neutral grayscale theme via CSS custom properties (`:root`), full-motion
  layout, and the reduced-motion layout (`.no-motion` class + mirrored `@media` block).
- `script.js` — branches once on `prefers-reduced-motion` at load; either builds the GSAP
  timeline or wires the `IntersectionObserver` cross-fade. Also the FPS counter.

## Serving it

```
python3 -m http.server 8080 --directory workspace/prototypes/pdp-scroll-reveal
```

Then open `http://localhost:8080/` (add `?debug=1` for the FPS badge). To see the reduced
motion variant in a real browser without changing OS settings, use DevTools → Rendering →
"Emulate CSS media feature `prefers-reduced-motion`".
