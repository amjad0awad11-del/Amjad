"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/cn";

type Props = {
  children: ReactNode;
  /** Total travel in pixels across the whole scroll range. Keep it small. */
  distance?: number;
  className?: string;
};

/**
 * Soft parallax for editorial photography.
 *
 * The inner wrapper is scaled up slightly and shifted by a few percent as the
 * section passes, which reads as depth without ever exposing an empty edge.
 * Only `transform` is touched, and the whole thing is skipped for reduced
 * motion — where it renders as a perfectly ordinary, static image.
 */
export function ParallaxMedia({ children, distance = 48, className }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    if (reduced === null || reduced) return;
    const frame = frameRef.current;
    const inner = innerRef.current;
    if (!frame || !inner) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        inner,
        { yPercent: -3 },
        {
          yPercent: 3,
          ease: "none",
          scrollTrigger: {
            trigger: frame,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    });

    return () => context.revert();
  }, [reduced, distance]);

  return (
    <div
      ref={frameRef}
      className={cn("relative overflow-hidden", className)}
    >
      {/* Scaled a touch beyond the frame so the parallax shift never reveals
          the edge of the image. */}
      <div ref={innerRef} className="h-full w-full scale-[1.08]">
        {children}
      </div>
    </div>
  );
}
