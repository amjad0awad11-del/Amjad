---
name: video-brief
description: Write a full video brief with a per-platform spec and a real credit estimate, and queue it for approval. Never renders. Use for promos, product loops, ads, explainers and social clips.
---

# /video-brief [what]

Hand this to `motion-producer`. **It ends in the queue, never in a render.**

Read the credit balance first (`mcp__Motion__get_credit_balance`) — an estimate with no
balance behind it is a guess wearing a number's clothes.

The brief carries every field, every time:

- **Goal** — the business outcome, not "a promo video".
- **Audience** — who, where they see it, what they already believe.
- **Hook (first 3 seconds)** — the actual shot and the actual on-screen words. This is the
  field that decides whether the video works. If you can't write a hook you would stop
  scrolling for, the brief isn't ready.
- **Beat-by-beat structure**, timestamped, with the visual and the audio or on-screen text
  for each beat.
- **Voice and tone**, and whether there's a VO and in which language — check
  `memory/brand.md`.
- **Aspect ratio and duration per platform.** Say which you are producing natively and
  which are crops, and keep text inside the safe areas.
- **Source material** — the exact product URLs, article, images or copy. Motion does its own
  research and production from a brief, so give it goal, sources, audience, tone and key
  points, not a shot-by-shot script it has to fight.
- **Estimated credit cost** with the proposed mode (`light` cheapest, `medium` balanced,
  `high` dearest), the current balance, and the balance after. Mark it "estimate, not
  confirmed" if you could not get a real number.
- **If you reject** — the cheaper mode, or a storyboard Amjad can shoot on a phone.

Write it to `workspace/drafts/video-<slug>-<date>.md`, then attempt the render call so the
gate stubs the proposal, and paste the brief into the stub as the preview.

State this in the proposal, in these words:

> Approving this authorises **one** render at `mode: <mode>`, ~N credits. Any revision comes
> back as a separate proposal.

Payment is RED and not queueable. If the balance is too low, say so and stop — topping up is
Amjad's decision, made outside Marsam.
