"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Page-level scroll behaviour: the reveal engine, plus the fragment-landing
 * correction. Renders no markup.
 *
 * REVEALS
 * Any element carrying `data-reveal` gets a gentle fade-and-rise as it enters
 * the viewport. A single `ScrollTrigger.batch` keeps the number of scroll
 * listeners flat no matter how many sections exist, and gives neighbouring
 * elements a natural stagger for free. Only `opacity` and `transform` are
 * animated — never layout properties — so the page stays on the compositor.
 */
export function ScrollReveals() {
  const reduced = useReducedMotion();
  const armed = useRef(false);

  useIsomorphicLayoutEffect(() => {
    // `null` means the media query has not been read yet; wait for the real
    // value rather than guessing and then having to undo an animation.
    if (reduced === null || reduced || armed.current) return;
    armed.current = true;

    const root = document.documentElement;
    // Hand the hidden resting state over to CSS only now that we are certain
    // the engine is live. Before this line, everything is visible.
    root.classList.add("reveal-ready");

    const context = gsap.context(() => {
      /**
       * Anything the guest has ALREADY scrolled past is shown immediately,
       * with no animation.
       *
       * This matters because the page can start at a scroll position that is
       * not the top: a reload restores the previous offset, and a shared or
       * bookmarked `…/#besuch` link lands mid-page. A `once: true` trigger only
       * fires when its start line is crossed on the way down, so content above
       * the viewport would otherwise stay at `opacity: 0` forever — a blank
       * page for anyone who did not arrive at the top and scroll.
       */
      for (const element of root.querySelectorAll<HTMLElement>("[data-reveal]")) {
        if (element.getBoundingClientRect().bottom < 0) {
          gsap.set(element, { opacity: 1, y: 0 });
          element.setAttribute("data-reveal-done", "true");
        }
      }

      ScrollTrigger.batch("[data-reveal]", {
        // 12% up from the bottom edge: the element is comfortably in view when
        // it starts, so the motion reads as arrival rather than as a late load.
        start: "top 88%",
        once: true,
        batchMax: 4,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.85,
            stagger: 0.08,
            ease: "power3.out",
            overwrite: "auto",
            onComplete: () => {
              batch.forEach((element) =>
                element.setAttribute("data-reveal-done", "true"),
              );
            },
          }),
      });
    });

    return () => {
      context.revert();
      root.classList.remove("reveal-ready");
      armed.current = false;
    };
  }, [reduced]);

  /**
   * FRAGMENT LANDING
   *
   * The browser performs its `#hash` jump while parsing, using the document as
   * it is at that moment. Afterwards the height changes twice more: hydration
   * mounts the hero, ScrollTrigger inserts a pin spacer worth 80vh, and the
   * lazy gallery images resolve. The original jump is left pointing at the
   * wrong offset — measured: `/#besuch` landed at y≈95 instead of y≈6076, i.e.
   * back at the top of the page.
   *
   * So the target is re-acquired after layout settles. Runs regardless of the
   * motion preference, because it is navigation, not decoration.
   */
  useEffect(() => {
    const { hash } = window.location;
    if (hash.length < 2) return;

    let cancelled = false;

    const land = () => {
      if (cancelled) return;
      let target: HTMLElement | null = null;
      try {
        target = document.getElementById(decodeURIComponent(hash.slice(1)));
      } catch {
        // A malformed escape sequence in the fragment — nothing to land on.
        return;
      }
      // `behavior: "auto"` overrides the global `scroll-behavior: smooth`, so
      // this is a correction rather than a second animated jump. `block:
      // "start"` honours the html `scroll-padding-top`, which already accounts
      // for the sticky header.
      target?.scrollIntoView({ behavior: "auto", block: "start" });
    };

    // Two frames covers hydration and the pin spacer; the load event covers
    // images and fonts; the timeout is the belt-and-braces case where a slow
    // chunk pushes ScrollTrigger's refresh past `load`.
    const frame = requestAnimationFrame(() => requestAnimationFrame(land));
    window.addEventListener("load", land, { once: true });
    const timer = window.setTimeout(land, 700);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("load", land);
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
