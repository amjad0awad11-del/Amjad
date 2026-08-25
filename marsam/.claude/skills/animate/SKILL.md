---
name: animate
description: Build a real, running web-animation prototype in workspace/prototypes/ and show the result. Use for scroll-driven sequences, page transitions, micro-interactions and hero motion.
---

# /animate [what]

Hand this to `web-animator`. **Build it, don't describe it.**

**1. Purpose test, before any code.** What does this help the user understand or do? If the
honest answer is "it looks premium", cut it and say you cut it, in one line.

**2. Build the prototype** in `workspace/prototypes/<slug>/` as a standalone page. GREEN —
free rein. Real markup, real CSS, real JS, real copy and colours from `memory/brand.md`,
never lorem ipsum. Self-contained so it runs offline.

**3. Serve and watch it:**

```
python3 -m http.server 8080 --directory workspace/prototypes/<slug>
```

**4. Non-negotiables, verified rather than assumed:**

- `transform` and `opacity` only — never layout properties.
- No CLS: space reserved before the animation runs.
- `will-change` set just before, removed on complete.
- `prefers-reduced-motion` with a real reduced variant that still communicates the same
  thing — not `animation: none`.
- Every ScrollTrigger killed on unmount.
- 60fps **verified** — a Performance trace, frame timings, or an rAF counter left in the
  page. Say which. "Should be smooth" is not verification.

**5. Show the result.** A screenshot sequence, a frame-timing log, or a recording, plus the
path to the prototype and the command to run it. **Amjad judges motion by watching it.**

**6. One page of rationale** next to the prototype: the purpose test, the durations and
easings with the reason for each, and what you measured.

**Integration into any of Amjad's real projects is YELLOW** — attempt the edit so the gate
stubs it, then complete the stub with the actual unified diff. Adding GSAP or Lenis as a
dependency is part of that proposal, with its bundle-size cost stated.
