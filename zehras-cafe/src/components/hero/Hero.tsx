"use client";

import { useRef } from "react";
import { ArrowDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HeroVideo } from "@/components/hero/HeroVideo";
import { business, hero, routeCta } from "@/content/cafe";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { useReducedMotion } from "@/lib/useReducedMotion";

/** Opening values, matching the ranges the brief specifies. */
const CLOSED = {
  rotateX: 9,
  rotateY: -6,
  scale: 0.86,
  clipPath: "inset(13% 19% 13% 19% round 34px)",
};

/** Mobile opening values — no rotation, gentler crop. */
const CLOSED_MOBILE = {
  scale: 0.93,
  clipPath: "inset(7% 9% 7% 9% round 26px)",
};

/** Front-facing cinematic end state, with a refined but reduced radius. */
const OPEN = {
  rotateX: 0,
  rotateY: 0,
  scale: 1,
  clipPath: "inset(0% 0% 0% 0% round 14px)",
};

/**
 * The homepage hero: a café display window that opens in 3D as the guest starts
 * to scroll.
 *
 * All text — eyebrow, headline, supporting line, both buttons and the address —
 * is ordinary HTML *outside* the video, so it is in the initial server-rendered
 * markup, selectable, translatable and readable by search engines and screen
 * readers whether or not the clip ever plays.
 *
 * Three motion branches, selected by `gsap.matchMedia()` so they re-evaluate on
 * resize and on an OS preference change:
 *
 *   ≥900px  A short pinned, scrubbed timeline. The card unfolds from a tilted,
 *           cropped window to a front-facing 16:9 while the copy lifts. The pin
 *           lasts 80vh on top of the 100vh view — about 180vh in total, which is
 *           the upper end of the brief's range and still well short of feeling
 *           like a trap. `pinSpacing` generates that scroll distance itself, so
 *           no fixed section height is hard-coded.
 *   <900px  No pin at all. One soft expansion into a responsive 16:9 as the card
 *           enters the viewport, then the guest scrolls on unimpeded.
 *   reduce  No timeline is built and the card is never armed, so it renders in
 *           its stable, flat, final state and the clip does not autoplay.
 */
export function Hero() {
  const reduced = useReducedMotion();

  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    // Wait for the real preference; never animate on a guess.
    if (reduced === null || reduced) return;

    const card = cardRef.current;
    const inner = innerRef.current;
    const section = sectionRef.current;
    if (!card || !inner || !section) return;

    const matchMedia = gsap.matchMedia();

    matchMedia.add("(min-width: 900px)", () => {
      // Arming happens inside the layout effect, before paint, so the CSS
      // resting state and the timeline's `from` values agree on frame one.
      card.dataset.heroArmed = "true";

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          // 80% of the viewport height of scrubbing — just enough to read as a
          // deliberate reveal, short enough that nobody feels held.
          end: "+=80%",
          scrub: 0.6,
          pin: inner,
          pinSpacing: true,
          anticipatePin: 1,
        },
        defaults: { ease: "power3.out" },
      });

      timeline
        // fromTo, not to: browsers normalise a computed `inset(13% 19% 13% 19%)`
        // down to `inset(13% 19%)`, which would leave GSAP interpolating a
        // different number of values. Stating both ends keeps it exact.
        .fromTo(card, { ...CLOSED }, { ...OPEN, duration: 1 }, 0)
        .fromTo(
          glowRef.current,
          { opacity: 0.85, scale: 0.96 },
          { opacity: 0.32, scale: 1.06, duration: 1 },
          0,
        )
        .to(".hero-glass", { opacity: 0, duration: 0.75 }, 0)
        // The copy lifts but stays fully legible for the first two thirds; only
        // as the hero hands over to the next section does it recede.
        .fromTo(copyRef.current, { y: 0 }, { y: -48, duration: 1 }, 0)
        // Starts late and stops at 0.62: the brief requires the copy to stay
        // readable through the transition, so it recedes rather than vanishes.
        .to(copyRef.current, { opacity: 0.62, duration: 0.28 }, 0.72)
        .to(hintRef.current, { opacity: 0, duration: 0.22 }, 0);

      return () => {
        delete card.dataset.heroArmed;
      };
    });

    matchMedia.add("(max-width: 899px)", () => {
      card.dataset.heroArmed = "true";

      const tween = gsap.fromTo(
        card,
        { ...CLOSED_MOBILE },
        {
          scale: 1,
          clipPath: "inset(0% 0% 0% 0% round 16px)",
          duration: 1.1,
          ease: "power4.out",
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            once: true,
          },
        },
      );

      const glassTween = gsap.to(".hero-glass", {
        opacity: 0.15,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: { trigger: card, start: "top 88%", once: true },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        glassTween.scrollTrigger?.kill();
        glassTween.kill();
        delete card.dataset.heroArmed;
      };
    });

    return () => matchMedia.revert();
  }, [reduced]);

  return (
    <section
      id="start"
      ref={sectionRef}
      aria-labelledby="hero-heading"
      className="relative"
    >
      <div ref={innerRef} className="hero-inner shell">
        <div className="hero-layout">
          <div ref={copyRef} className="hero-copy">
            <span className="eyebrow">{hero.eyebrow}</span>

            <h1 id="hero-heading" className="hero-headline">
              {hero.headlineLines.map((line, index) => (
                <span
                  key={line}
                  className="block"
                  // "Hausgemacht." is the line the café is judged on, so it
                  // carries the caramel accent while the other two stay
                  // espresso. --caramel-deep, not --caramel: this is text, and
                  // only the deep tone clears 4.5:1 on cream.
                  style={
                    index === 1 ? { color: "var(--caramel-deep)" } : undefined
                  }
                >
                  {line}
                </span>
              ))}
            </h1>

            <p className="lead max-w-[46ch]">{hero.support}</p>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                href={routeCta.href}
                aria-label={routeCta.ariaLabel}
                size="lg"
                icon={<MapPin size={17} strokeWidth={2.1} aria-hidden="true" />}
              >
                {routeCta.label}
              </Button>
              <Button href={hero.secondaryCta.href} variant="secondary" size="lg">
                {hero.secondaryCta.label}
              </Button>
            </div>

            {/* Address card — ceramic surface, hairline edge, real text. */}
            <div className="mt-1 inline-flex items-center gap-3 rounded-[var(--r-card)] border border-[var(--hairline)] bg-[var(--ceramic)] px-4 py-3 shadow-[var(--shadow-sm)]">
              <MapPin
                size={18}
                strokeWidth={2}
                aria-hidden="true"
                className="shrink-0 text-[var(--caramel-deep)]"
              />
              <span className="text-left">
                <span className="block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  {hero.addressCardLabel}
                </span>
                <span className="block text-[0.9375rem] font-medium text-[var(--espresso)]">
                  {business.address.inline}
                </span>
              </span>
            </div>
          </div>

          <div className="hero-stage">
            <div ref={glowRef} className="hero-glow" aria-hidden="true" />
            <div ref={cardRef} className="hero-card on-dark">
              <HeroVideo reducedMotion={reduced} />
            </div>
          </div>
        </div>

        <div
          ref={hintRef}
          className="hero-hint no-print self-start"
          aria-hidden="true"
        >
          <span className="hero-hint-rule" />
          <ArrowDown size={14} strokeWidth={2} />
          {hero.scrollHint}
        </div>
      </div>
    </section>
  );
}
