"use client";

import { useRef, useState } from "react";
import { gsap, DUR, EASE, STAGGER, prefersReducedMotion, simpleFade } from "@/lib/motion";
import { useGsap } from "@/lib/useGsap";
import { useHeroReady } from "@/components/motion/HeroGate";
import { RevealText } from "@/components/motion/RevealText";
import { Glow } from "@/components/motion/Atmosphere";
import { ShowreelLightbox } from "@/components/motion/ShowreelLightbox";
import { Button } from "@/components/ui/Button";
import { hero } from "@/content/de";

/**
 * S2 — Hero.
 *
 * A6 headline reveal, A7 media intro plus scroll-out, A8 scroll cue, A31 glow
 * and the A32 showreel trigger. The whole timeline waits on the preloader.
 */
export function Hero({ hasVideo }: { hasVideo: boolean }) {
  const scope = useRef<HTMLElement>(null);
  const ready = useHeroReady();
  const [reelOpen, setReelOpen] = useState(false);

  useGsap(
    () => {
      const root = scope.current;
      if (!root || !ready) return;

      const media = root.querySelector<HTMLElement>("[data-hero-media]");
      const eyebrow = root.querySelector<HTMLElement>("[data-hero-eyebrow]");
      const tail = gsap.utils.toArray<HTMLElement>("[data-hero-tail]");
      const cue = root.querySelector<HTMLElement>("[data-hero-cue]");

      if (prefersReducedMotion()) {
        simpleFade([eyebrow, ...tail, cue].filter(Boolean) as HTMLElement[]);
        return;
      }

      const timeline = gsap.timeline();

      // A7 — media settles out of an overscale as the page arrives.
      if (media) {
        timeline.fromTo(
          media,
          { scale: 1.14 },
          { scale: 1, duration: DUR.slow * 1.4, ease: EASE.expo },
          0
        );
      }

      timeline.fromTo(
        eyebrow,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: DUR.base, ease: EASE.out },
        0
      );

      // Sub-headline, CTAs and badges follow the headline lines.
      timeline.fromTo(
        tail,
        { autoAlpha: 0, y: 20 },
        {
          autoAlpha: 1,
          y: 0,
          duration: DUR.base,
          ease: EASE.out,
          stagger: STAGGER.words,
        },
        STAGGER.words * 4 + 0.5
      );

      // A8 — scroll cue bobs, then fades out once the hero starts leaving.
      if (cue) {
        timeline.fromTo(cue, { autoAlpha: 0 }, { autoAlpha: 1, duration: DUR.fast }, 1.1);
        gsap.to(cue.querySelector("[data-cue-line]"), {
          y: 10,
          duration: 1.4,
          ease: EASE.inOut,
          repeat: -1,
          yoyo: true,
        });
        gsap.to(cue, {
          autoAlpha: 0,
          ease: EASE.linear,
          scrollTrigger: { trigger: root, start: "top top", end: "12% top", scrub: true },
        });
      }

      // A7 — scroll-out.
      if (media) {
        gsap.to(media, {
          scale: 0.92,
          borderRadius: 24,
          opacity: 0.45,
          yPercent: -8,
          ease: EASE.linear,
          scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
        });
      }
    },
    scope,
    [ready]
  );

  return (
    <>
      <section
        ref={scope}
        id={hero.id}
        data-theme="dark"
        aria-labelledby="hero-title"
        className="relative flex min-h-[100dvh] flex-col justify-end overflow-hidden"
      >
        <div className="absolute inset-0 -z-10">
          <div data-hero-media className="absolute inset-0 overflow-hidden will-change-transform">
            {hasVideo ? (
              <video
                className="h-full w-full object-cover"
                src={hero.video}
                poster={hero.poster}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label={hero.videoAlt}
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={hero.poster}
                alt=""
                className="h-full w-full object-cover"
                width={1920}
                height={1080}
                fetchPriority="high"
              />
            )}
          </div>
          {/* 55% ink veil so the headline clears contrast over any frame. */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "color-mix(in srgb, var(--ink) 55%, transparent)" }}
            aria-hidden="true"
          />
          <Glow className="left-[-10%] top-[10%] h-[60vmax] w-[60vmax]" />
        </div>

        <div className="wrap pb-[clamp(28px,6vh,72px)] pt-[calc(var(--header-h)+40px)]">
          <p data-hero-eyebrow className="t-mono mb-8" style={{ color: "var(--amber)" }}>
            {hero.eyebrow}
          </p>

          <h1 id="hero-title" className="t-display max-w-[16ch]">
            {hero.h1.map((line, index) => (
              <RevealText
                key={line}
                as="span"
                className="block"
                variant="hero"
                immediate
                play={ready}
                delay={index * STAGGER.lines}
              >
                {line}
              </RevealText>
            ))}
          </h1>

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="flex flex-col gap-8">
              <p data-hero-tail className="t-body t-muted">
                {hero.sub}
              </p>
              <div data-hero-tail className="flex flex-wrap gap-4">
                <Button label={hero.ctaPrimary.label} href={hero.ctaPrimary.href} />
                <Button
                  label={hero.ctaSecondary.label}
                  href={hero.ctaSecondary.href}
                  variant="outline"
                  onClick={() => setReelOpen(true)}
                />
              </div>
            </div>

            <ul
              data-hero-tail
              className="flex flex-wrap gap-x-8 gap-y-2 border-t pt-5 lg:border-t-0 lg:pt-0"
              style={{ borderColor: "var(--hairline)" }}
            >
              {hero.badges.map((badge) => (
                <li key={badge} className="t-mono t-muted">
                  {badge}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          data-hero-cue
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[clamp(28px,6vh,72px)] left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 xl:flex"
        >
          <span data-cue-line className="block h-8 w-px" style={{ backgroundColor: "var(--amber)" }} />
          <span className="t-mono t-muted">{hero.scrollCue}</span>
        </div>
      </section>

      <ShowreelLightbox open={reelOpen} onClose={() => setReelOpen(false)} hasVideo={hasVideo} />
    </>
  );
}
