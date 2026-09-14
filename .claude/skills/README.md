# Project skills

Agent Skills installed at the project level. Claude Code (and any agent that reads
`.claude/skills/`) picks these up automatically — each `SKILL.md` frontmatter
`description` decides when the skill loads. Nothing here is imported by the app;
these files are guidance for agents, not runtime code.

## GSAP — `gsap-skills` v1.0.0

Official GreenSock skills. Directly relevant: this project already ships
`gsap@^3.15` with React 19 / Next 16.

| Skill | Focus |
| --- | --- |
| `gsap-core` | `gsap.to/from/fromTo`, easing, stagger, defaults, `matchMedia` (responsive + reduced motion) |
| `gsap-timeline` | `gsap.timeline()`, position parameter, labels, nesting, playback |
| `gsap-scrolltrigger` | Scroll-linked animation, pinning, scrub, refresh, cleanup |
| `gsap-plugins` | Plugin registration, Flip, Draggable, Observer, SplitText, SVG and easing plugins |
| `gsap-react` | `useGSAP`, refs, `gsap.context()`, cleanup on unmount |
| `gsap-frameworks` | Vue/Nuxt, Svelte/SvelteKit lifecycle and scoping |
| `gsap-performance` | Transforms over layout, avoiding thrash, `will-change`, batching |
| `gsap-utils` | `gsap.utils`: clamp, mapRange, normalize, interpolate, random, snap, toArray, wrap, pipe |

Source: <https://github.com/greensock/gsap-skills>. MIT — see `LICENSE-gsap-skills`.

## React Three Fiber — `r3f-skills`

R3F is not a dependency of this project yet; these are installed for 3D work when
it happens. They target Fiber 9 / React 19 / Three r185 and each tells the agent
to check the consuming project's installed versions before choosing APIs.

| Skill | Focus |
| --- | --- |
| `r3f-fundamentals` | Canvas, typed JSX, hooks, renderer choice, resource ownership |
| `r3f-geometry` | Geometry, custom buffers, instancing, points, lines |
| `r3f-materials` | PBR, transparency, transmission, material cost |
| `r3f-lighting` | Direct lights, environment maps, shadows |
| `r3f-textures` | Color spaces, UV channels, sampling, video, render targets |
| `r3f-loaders` | `useGLTF`/`useLoader`, Suspense, decoders, caching, clones |
| `r3f-animation` | `useFrame`, damping, demand rendering, GLTF clips |
| `r3f-shaders` | GLSL/TSL materials, uniforms, vertex deformation |
| `r3f-postprocessing` | Composer pipelines, selective bloom, AO, depth of field |
| `r3f-interaction` | Pointer events, picking, dragging, keyboard, camera controls |
| `r3f-physics` | Rapier rigid bodies, colliders, forces, sensors, joints |

Source: <https://github.com/EnzeD/r3f-skills>. Six skills carry optional deep-dive
recipes in their own `references/` directory, loaded only when needed.

## Updating

Both packs publish through the [skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add greensock/gsap-skills
npx skills add EnzeD/r3f-skills
```

Manual alternative: copy the upstream `skills/<name>/` folders over the ones here,
keeping their `references/` subfolders. The packs' repo-level tooling (evals,
validation harness, dev dependencies) is not needed to use the skills and is not
vendored here.
