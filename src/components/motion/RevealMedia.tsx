"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { gsap, DUR, EASE, START, prefersReducedMotion, simpleFade } from "@/lib/motion";
import { useGsap } from "@/lib/useGsap";

type RevealMediaProps = {
  children: ReactNode;
  className?: string;
  /** Seconds of delay, for staggering a grid of media (A28). */
  delay?: number;
  /** Skips the clip-path wipe and only fades — used inside already-animated parents. */
  fadeOnly?: boolean;
};

/**
 * A11 — media mask reveal.
 *
 * The frame wipes open with clip-path while the media inside scales back from
 * 1.22 to 1, so the image appears to settle rather than pop.
 */
export function RevealMedia({ children, className, delay = 0, fadeOnly = false }: RevealMediaProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGsap(
    () => {
      const frame = scope.current;
      if (!frame) return;
      const inner =
        frame.querySelector<HTMLElement>("[data-reveal-inner]") ??
        (frame.firstElementChild as HTMLElement | null);

      if (prefersReducedMotion() || fadeOnly) {
        simpleFade(frame, {
          delay,
          scrollTrigger: { trigger: frame, start: START.default, once: true },
        });
        return;
      }

      const timeline = gsap.timeline({
        delay,
        scrollTrigger: { trigger: frame, start: START.default, once: true },
        onComplete: () => {
          frame.style.willChange = "";
          if (inner) inner.style.willChange = "";
        },
      });

      frame.style.willChange = "clip-path";
      timeline.fromTo(
        frame,
        { clipPath: "inset(0 0 100% 0)" },
        { clipPath: "inset(0 0 0% 0)", duration: DUR.slow, ease: EASE.expo }
      );

      if (inner) {
        inner.style.willChange = "transform";
        timeline.fromTo(
          inner,
          { scale: 1.22 },
          { scale: 1, duration: DUR.slow, ease: EASE.expo },
          0
        );
      }
    },
    scope,
    [delay, fadeOnly]
  );

  return (
    <div ref={scope} className={clsx("media-frame", className)}>
      {children}
    </div>
  );
}
