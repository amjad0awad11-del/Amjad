# public/media

Empty on purpose.

The hero clip supplied in the brief is loaded from its original external URL,
which is set in `src/content/cafe.ts` as `heroVideo.src`.

## Serving the video from your own domain (recommended before launch)

Loading it from a third-party host means every visitor's IP address is sent to
that host, which has to be disclosed in the privacy policy (there is a
placeholder for exactly this in `legal.datenschutz`), and you are depending on
someone else's uptime for your most prominent asset.

To self-host it instead:

1. Download the file and put it here as `public/media/hero.mp4`.
2. Change `heroVideo.src` in `src/content/cafe.ts` to `"/media/hero.mp4"`.
3. Remove the video paragraph from `legal.datenschutz` — there is no longer a
   third-party request to disclose.

Nothing else changes: the hero reads that one value.

## Poster frame

`public/images/hero-poster.jpg` (1920×1080) is currently a designed brand still,
because the video host was not reachable from the build environment. A real
frame from the clip is better. Any tool works, for example:

```bash
ffmpeg -i public/media/hero.mp4 -ss 00:00:01.5 -frames:v 1 -q:v 2 public/images/hero-poster.jpg
```
