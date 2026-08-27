"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap, DUR, EASE, STAGGER, prefersReducedMotion, refreshScrollTrigger } from "@/lib/motion";
import { useSmoothScroll } from "@/components/motion/SmoothScrollProvider";
import { preloader, a11y } from "@/content/de";

const SESSION_KEY = "amw:preloaded";
const LOCK = "preloader";

/**
 * A1 — first-visit-per-session preloader.
 *
 * Counter runs 0→100 while the wordmark letters rise out of their masks, then
 * two ink panels split apart to reveal the page. Scroll is locked throughout
 * and the hero timeline waits on `onDone`.
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
      const panels = gsap.utils.toArray<HTMLElement>("[data-preloader-panel]");
      const progress = { value: 0 };

      gsap.set(letters, { yPercent: 110 });
      gsap.set(subline, { autoAlpha: 0 });

      const timeline = gsap.timeline({ onComplete: finish });

      // The mark drives up from oversize before the curtain splits, so the
      // opening reads as a title card rather than a spinner.
      timeline
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
              if (counterEl) counterEl.textContent = String(Math.round(progress.value));
            },
          },
          0
        )
        .to([counterEl, subline], { autoAlpha: 0, duration: 0.3, ease: EASE.out })
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
            {preloader.subline}
          </span>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-[var(--page-x)] right-[var(--page-x)] leading-none"
        style={{ color: "var(--cream)" }}
      >
        <span className="sr-only">{a11y.decorative}</span>
        <span data-preloader-count className="t-display tabular-nums" aria-hidden="true">
          0
        </span>
      </div>
    </div>
  );
}
