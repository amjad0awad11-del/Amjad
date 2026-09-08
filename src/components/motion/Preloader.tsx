"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap, DUR, EASE, STAGGER, prefersReducedMotion, refreshScrollTrigger } from "@/lib/motion";
import { useSmoothScroll } from "@/components/motion/SmoothScrollProvider";
import { WordCycler } from "@/components/motion/WordCycler";
import { preloader, a11y } from "@/content/de";

const SESSION_KEY = "amw:preloaded";
const LOCK = "preloader";

/**
 * A1 — first-visit-per-session preloader.
 *
 * The corner label drops in, the wordmark letters rise out of their masks, the
 * category word under them rotates on its own 900ms clock and the counter runs
 * 000→100 against a gradient bar along the bottom edge. Then two ink panels
 * split apart to reveal the page. Scroll is locked throughout and the hero
 * timeline waits on `onDone`.
 *
 * Under reduced motion, or on any later navigation in the same session, it
 * never mounts and the hero plays immediately.
 */
export function Preloader({ onDone }: { onDone: () => void }) {
  const { lock, unlock } = useSmoothScroll();
  const scope = useRef<HTMLDivElement>(null);
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Private mode blocks sessionStorage; the preloader just runs again.
    }
    document.documentElement.classList.remove("amw-preload");
    unlock(LOCK);
    refreshScrollTrigger();
    onDone();
  }, [onDone, unlock]);

  useEffect(() => {
    // The blocking script in <head> already decided this, before first paint,
    // and the .amw-preload class is what shows the overlay. Keeping that the
    // single source of truth means no React state and no mount-time re-render.
    const shouldRun = document.documentElement.classList.contains("amw-preload");
    const root = scope.current;

    if (!shouldRun || prefersReducedMotion() || !root) {
      finished.current = true;
      document.documentElement.classList.remove("amw-preload");
      onDone();
      return;
    }

    lock(LOCK);

    // Handheld gets a much shorter hold: the overlay is what Lighthouse
    // measures as the largest paint, and four seconds on cellular is a cost the
    // visitor pays for a flourish.
    const brisk = window.matchMedia("(max-width: 1023px)").matches;

    const context = gsap.context(() => {
      const letters = gsap.utils.toArray<HTMLElement>("[data-preloader-letter]");
      const wordmark = root.querySelector<HTMLElement>("[data-preloader-mark]");
      const counterEl = root.querySelector<HTMLElement>("[data-preloader-count]");
      const subline = root.querySelector<HTMLElement>("[data-preloader-sub]");
      const label = root.querySelector<HTMLElement>("[data-preloader-label]");
      const bar = root.querySelector<HTMLElement>("[data-preloader-bar]");
      const panels = gsap.utils.toArray<HTMLElement>("[data-preloader-panel]");
      const progress = { value: 0 };

      gsap.set(letters, { yPercent: 110 });
      gsap.set(subline, { autoAlpha: 0 });
      gsap.set(bar, { scaleX: 0, transformOrigin: "left center" });

      const timeline = gsap.timeline({ onComplete: finish });

      // The mark drives up from oversize before the curtain splits, so the
      // opening reads as a title card rather than a spinner.
      timeline
        .fromTo(
          label,
          { y: -20, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: DUR.fast, ease: EASE.out },
          0
        )
        .fromTo(
          wordmark,
          { scale: 1.6, letterSpacing: "0.3em" },
          { scale: 1, letterSpacing: "-0.04em", duration: brisk ? 0.9 : 1.6, ease: EASE.expo },
          0
        )
        .to(letters, {
          yPercent: 0,
          duration: brisk ? 0.6 : DUR.base,
          ease: EASE.expo,
          stagger: STAGGER.chars * 4,
        }, 0)
        .to(subline, { autoAlpha: 1, duration: DUR.fast, ease: EASE.out }, "-=0.4")
        .to(
          progress,
          {
            value: 100,
            duration: brisk ? 0.9 : 2,
            ease: EASE.inOut,
            snap: { value: 1 },
            onUpdate: () => {
              const done = Math.round(progress.value);
              // Three digits throughout, so the counter never changes width.
              if (counterEl) counterEl.textContent = String(done).padStart(3, "0");
              if (bar) gsap.set(bar, { scaleX: done / 100 });
            },
          },
          0
        )
        .to([counterEl, subline, label, bar], { autoAlpha: 0, duration: 0.3, ease: EASE.out })
        .to(
          [wordmark, panels],
          { scale: 1.08, duration: DUR.curtain, ease: EASE.curtain },
          "-=0.1"
        )
        .to(
          panels,
          {
            yPercent: (index) => (index === 0 ? -101 : 101),
            duration: DUR.curtain,
            ease: EASE.curtain,
          },
          "<"
        );
    }, root);

    // Never strand the user behind the overlay if a tween fails to complete.
    const failsafe = window.setTimeout(finish, 6000);

    return () => {
      window.clearTimeout(failsafe);
      context.revert();
    };
  }, [lock, onDone, finish]);

  return (
    <div
      ref={scope}
      className="preloader fixed inset-0 z-[180]"
      // Everything in here is faded out and display:none by the time the page
      // is usable; the QA sweep would otherwise read that as missing content.
      data-qa-transient
      role="status"
      aria-live="polite"
      aria-label={preloader.subline}
    >
      <div className="absolute inset-0 flex flex-col">
        <div
          data-preloader-panel
          className="h-1/2 w-full"
          style={{ backgroundColor: "var(--ink)" }}
        />
        <div
          data-preloader-panel
          className="h-1/2 w-full"
          style={{ backgroundColor: "var(--ink)" }}
        />
      </div>

      <p
        data-preloader-label
        className="t-mono pointer-events-none absolute left-[var(--page-x)] top-[var(--page-x)]"
        style={{ color: "var(--ash-on-dark)" }}
      >
        {preloader.topLabel}
      </p>

      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="flex flex-col items-center gap-5">
          <span data-preloader-mark className="flex overflow-hidden" style={{ color: "var(--cream)" }}>
            {preloader.wordmark.split("").map((letter, index) => (
              <span key={`${letter}-${index}`} className="overflow-hidden">
                <span data-preloader-letter className="block t-display">
                  {letter}
                </span>
              </span>
            ))}
          </span>
          <span data-preloader-sub className="t-mono" style={{ color: "var(--amber)" }}>
            <WordCycler words={preloader.words} interval={900} />
          </span>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-[var(--page-x)] right-[var(--page-x)] leading-none"
        style={{ color: "var(--cream)" }}
      >
        <span className="sr-only">{a11y.decorative}</span>
        <span data-preloader-count className="t-display tabular-nums" aria-hidden="true">
          000
        </span>
      </div>

      {/* Fills left to right with the counter. The glow is what keeps a 3px
          hairline readable against a full-bleed ink ground. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px]"
        style={{ backgroundColor: "color-mix(in srgb, var(--cream) 12%, transparent)" }}
        aria-hidden="true"
      >
        <div
          data-preloader-bar
          className="accent-gradient h-full w-full origin-left"
          style={{ transform: "scaleX(0)", boxShadow: "0 0 8px color-mix(in srgb, var(--amber) 45%, transparent)" }}
        />
      </div>
    </div>
  );
}
