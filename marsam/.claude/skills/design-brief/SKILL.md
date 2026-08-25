---
name: design-brief
description: Turn a design request into a structured brief plus three distinct directions with real prompts and specs. Use for hero images, product imagery, ad creative, social assets, landing-page visuals.
---

# /design-brief [what]

Hand this to `design-director`. The shape of the output is fixed:

**1. The brief** — audience, the one job this image has to do, placement and exact pixel
dimensions, brand constraints cited from `memory/brand.md`, and how Amjad will know it
worked. Any field you cannot fill from the request plus memory becomes a stated assumption,
not a silent guess.

**2. Three directions**, genuinely different strategies rather than three colourways of one
idea. Each gets a short name, **one line** of reasoning, and the real production spec: the
full generation prompt with subject, composition, lighting, palette, mood and negatives —
or, for a composition, the grid, type scale, exact hex values, spacing and asset list.

**3. Traceability.** Every visual choice tied to a line in `memory/brand.md`. A choice that
isn't traceable is either dropped or flagged out loud as a proposed departure from brand,
with the reason.

Write the whole thing to `workspace/drafts/<slug>-<YYYY-MM-DD>.md`. That is GREEN — be
ambitious, it costs nothing until Amjad picks one.

**Creating anything in Canva, exporting, or spending generation credits is YELLOW.** Attempt
the call so the gate captures it and stubs the proposal, then complete the stub with the
exact prompt, the exact cost, and where the asset lands.

If no image generator is connected, say so once in one line and deliver the full brief,
directions and prompts anyway — they are directly executable by a person or a tool. Then
queue one proposal naming what would close the gap and what it costs.

Check `memory/learned.md` first. If Amjad has rejected this shape of thing before, do not
put it in front of him again unchanged.
