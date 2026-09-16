# GRIDO1 Racing Systems — Kimi Antonelli

A one-page driver site, built to the KIMI / GRIDO1 specification: five blocks,
a cyan-on-ice palette, and every moving thing driven by a hand-written spring
solver off one shared rAF loop. `index.html` is the whole build — no bundler,
no framework, no build step.

German copy throughout, with AMW's own films in the seven timeline plates.

## Looking at it

It cannot be opened over `file://` — the page is an ES module, and browsers
refuse module scripts from a file URL. From the repository root:

```
npm run site            # http://localhost:8000
npm run site -- 3000    # another port
```

That script (`scripts/serve-site.mjs`) exists rather than a one-liner because
Python's `http.server` answers no Range requests, and a `<video>` handed a
`200` with the whole body instead of a `206` is dropped by Chromium — all
seven plates come up blank on their posters.

## What it needs from the network

| from | what |
|---|---|
| `cdn.jsdelivr.net` | three.js 0.185.0 and Lenis 1.3.26, through the import map |
| `fonts.googleapis.com` | Oswald and Space Grotesk |
| `storage.getlayers.ai` | the helmet GLB, the studio HDR, the portrait maps, the logos and icons |

Served from this directory: `assets/media/work-1…7.mp4` (the timeline films)
and `assets/images/work-1…6.jpg` (their posters).

A failed load is never silent — the page puts a banner along the foot naming
the URL that did not arrive. If WebGL is unavailable the hero falls back to
the static backdrop and the portrait, and the loading veil lifts at once.

## The five blocks

1. **Hero** — the masthead and the driver's identity over a WebGL scene: a
   depth-parallax portrait wearing a Mercedes helmet that burns away
   crown-to-chin, after which it exists only where the cursor has just been.
2. **Die Saison bisher** — the first dark surface, seamed to the hero by a
   chequered flag coming apart. Behind the copy, an instrument-panel map whose
   circuit fills clockwise in one six-second lap, then cools; after that the
   cursor becomes a reticle over an 8,004-dot halftone.
3. **Von Karts zur F1** — seven films in stepped-corner plates, a rail down
   the middle whose marker turns five times over the block, and three
   parallax layers per row.
4. **Aus dem Fahrerlager** — back to light: the race report, the portrait
   bleeding off both ends of the block, and a five-round calendar strip on a
   dark band.
5. **Immer weiter nach vorn** — a cyan page edge around a near-black panel,
   with the figure riding back into place as the page bottoms out.

The first three are a sticky stack: each pins, the next comes out over it, and
the covered one recedes to 0.9 and darkens to 55% rather than scrolling away.
