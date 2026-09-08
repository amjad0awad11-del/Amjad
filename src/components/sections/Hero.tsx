"use client";

import { useEffect, useRef, useState } from "react";
import {
  gsap,
  BLUR_IN,
  CYCLE,
  DUR,
  EASE,
  STAGGER,
  prefersReducedMotion,
  simpleFade,
} from "@/lib/motion";
import { useGsap } from "@/lib/useGsap";
import { useHeroReady } from "@/components/motion/HeroGate";
import { RevealText } from "@/components/motion/RevealText";
import { WordCycler } from "@/components/motion/WordCycler";
import { Glow } from "@/components/motion/Atmosphere";
import { ShowreelLightbox } from "@/components/motion/ShowreelLightbox";
import { Button } from "@/components/ui/Button";
import { hero } from "@/content/de";

/**
 * The creative wall behind the headline.
 *
 * Four vertical clips in columns that drift at different speeds and phases, so
 * the background reads as a living showreel rather than one looping backdrop.
 * Playback starts only once the preloader has cleared, which keeps four video
 * decodes off the critical path — the headline stays the LCP element.
 */
function CreativeWall({ ready }: { ready: boolean }) {
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready) return;
    const root = scope.current;
    if (!root) return;
    // Autoplay can be refused; the first frame still stands in for the clip.
    root.querySelectorAll("video").forEach((video) => {
      // Skip the columns CSS has hidden — otherwise they still download.
      if (video.offsetParent === null) return;
      video.load();
      void video.play().catch(() => undefined);
    });
  }, [ready]);

  useGsap(
    () => {
      const columns = gsap.utils.toArray<HTMLElement>("[data-wall-col]");
      if (columns.length === 0) return;

      if (prefersReducedMotion()) {
        gsap.set(columns, { autoAlpha: 1 });
        return;
      }

      // Rise into place behind the headline.
      gsap.fromTo(
        columns,
        { autoAlpha: 0, yPercent: 14, scale: 1.08 },
        {
          autoAlpha: 1,
          yPercent: 0,
          scale: 1,
          duration: DUR.slow * 1.3,
          ease: EASE.expo,
          stagger: 0.08,
        }
      );

      // Each column breathes on its own clock, so the wall never pulses in sync.
      columns.forEach((column, index) => {
        gsap.to(column, {
          yPercent: index % 2 === 0 ? -6 : 6,
          duration: 14 + index * 3,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: index * 1.4,
        });
      });
    },
    scope,
    [ready]
  );

  return (
    <div
      ref={scope}
      aria-hidden="true"
      className="absolute inset-0 grid grid-cols-2 items-center gap-3 overflow-hidden px-3 sm:gap-4 md:grid-cols-4 md:px-6"
    >
      {hero.wall.slice(0, 4).map((src, index) => (
        <div
          key={src}
          data-wall-col
          className={`relative aspect-[9/16] w-full overflow-hidden rounded-[var(--r-media)] ${
            index > 1 ? "hidden md:block" : ""
          }`}
          style={{
            backgroundColor: "color-mix(in srgb, var(--cream) 6%, transparent)",
            // A gentle stagger down the row so the wall is not a flat band.
            transform: `translateY(${index % 2 === 0 ? -4 : 4}%)`,
          }}
        >
          {ready && (
            <video
              className="h-full w-full object-cover"
              src={src}
              muted
              loop
              playsInline
              preload="none"
              tabIndex={-1}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * S2 — Hero.
 *
 * The headline drives in from oversize word by word (A6), the creative wall
 * settles behind it (A7), and everything around it sheds a 10px blur on the way
 * up (`.blur-in`). The role word under the headline swaps on its own clock. The
 * whole block scales away on scroll. Scroll cue A8, glow A31, showreel trigger
 * A32.
 */
export function Hero({ hasShowreel }: { hasShowreel: boolean }) {
  const scope = useRef<HTMLElement>(null);
  const ready = useHeroReady();
  const [reelOpen, setReelOpen] = useState(false);

  useGsap(
    () => {
      const root = scope.current;
      if (!root || !ready) return;

      const stage = root.querySelector<HTMLElement>("[data-hero-stage]");
      const eyebrow = root.querySelector<HTMLElement>("[data-hero-eyebrow]");
      const tail = gsap.utils.toArray<HTMLElement>("[data-hero-tail]");
      const cue = root.querySelector<HTMLElement>("[data-hero-cue]");

      if (prefersReducedMotion()) {
        simpleFade([eyebrow, ...tail, cue].filter(Boolean) as HTMLElement[]);
        return;
      }

      const timeline = gsap.timeline();

      // Everything that is not the headline arrives out of focus and sharpens
      // as it settles. `clearProps` drops the filter afterwards so the hero
      // does not sit on a permanent compositing layer.
      const blurIn = {
        from: { autoAlpha: 0, y: 20, filter: `blur(${BLUR_IN}px)` },
        to: {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: DUR.base,
          ease: EASE.out,
          clearProps: "filter",
        },
      };

      timeline.fromTo(eyebrow, blurIn.from, blurIn.to, 0.1);

      timeline.fromTo(
        tail,
        blurIn.from,
        { ...blurIn.to, stagger: STAGGER.blur },
        0.9
      );

      if (cue) {
        timeline.fromTo(cue, { autoAlpha: 0 }, { autoAlpha: 1, duration: DUR.fast }, 1.3);
        gsap.to(cue, {
          autoAlpha: 0,
          ease: EASE.linear,
          scrollTrigger: { trigger: root, start: "top top", end: "12% top", scrub: true },
        });
      }

      // The whole hero recedes as the page moves on, rather than just fading.
      if (stage) {
        gsap.to(stage, {
          scale: 0.9,
          yPercent: -6,
          opacity: 0.3,
          borderRadius: 28,
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
        <div data-hero-stage className="absolute inset-0 -z-10 overflow-hidden will-change-transform">
          <CreativeWall ready={ready} />
          {/* Heavy at the bottom where the headline sits, light at the top so the
              creatives stay visible. */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, var(--ink) 12%, color-mix(in srgb, var(--ink) 74%, transparent) 52%, color-mix(in srgb, var(--ink) 46%, transparent) 100%)",
            }}
          />
          <Glow className="left-[-10%] top-[6%] h-[62vmax] w-[62vmax]" />
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

          {/* Body-sized so it groups with the headline rather than competing
              with it — only the swapping word is emphasised. */}
          <p data-hero-tail className="t-body mt-4">
            {hero.roleLine.before}{" "}
            <WordCycler
              words={hero.roleLine.roles}
              interval={CYCLE.role}
              variant="fade"
              className="t-accent font-semibold"
            />{" "}
            {hero.roleLine.after}
          </p>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
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
          {/* A short amber segment runs down a static hairline, rather than the
              whole line pulsing. */}
          <span
            data-cue-line
            className="relative block h-10 w-px overflow-hidden"
            style={{ backgroundColor: "var(--hairline)" }}
          >
            <span
              className="animate-scroll-down absolute inset-x-0 top-0 block h-1/3"
              style={{ backgroundColor: "var(--amber)" }}
            />
          </span>
          <span className="t-mono t-muted">{hero.scrollCue}</span>
        </div>
      </section>

      <ShowreelLightbox open={reelOpen} onClose={() => setReelOpen(false)} hasVideo={hasShowreel} />
    </>
  );
}
