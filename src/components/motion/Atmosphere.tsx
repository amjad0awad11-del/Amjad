"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import { gsap, prefersReducedMotion } from "@/lib/motion";

/** A31 — tiling film grain over the whole page. Purely decorative. */
export function Grain() {
  return <div className="grain" aria-hidden="true" />;
}

/**
 * A31 — the drifting amber blob behind the hero and the contact section.
 * Skipped entirely under reduced motion (CSS hides it as well).
 */
export function Glow({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) return;

    const timeline = gsap.timeline({ repeat: -1, yoyo: true });
    timeline.fromTo(
      element,
      { xPercent: -6, yPercent: -4, scale: 1 },
      { xPercent: 6, yPercent: 4, scale: 1.12, duration: 18, ease: "sine.inOut" }
    );

    return () => {
      timeline.kill();
    };
  }, []);

  return <div ref={ref} className={clsx("glow", className)} aria-hidden="true" />;
}
