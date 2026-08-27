"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { gsap, EASE } from "@/lib/motion";
import { useReducedMotion, useMediaQuery } from "@/lib/useReducedMotion";

const RADIUS = 120;
const PULL = 0.35;
const DURATION = 0.4;

/**
 * A17 — magnetic wrapper.
 *
 * Inside a 120px radius the element leans toward the pointer, then springs back
 * on leave. Purely decorative: it only translates a wrapper, so the button or
 * link inside keeps its own hit area, focus ring and keyboard behaviour.
 */
export function MagneticButton({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const scope = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const fine = useMediaQuery("(pointer: fine)");

  useEffect(() => {
    if (reduced !== false || fine !== true) return;
    const element = scope.current;
    if (!element) return;

    const moveX = gsap.quickTo(element, "x", { duration: DURATION, ease: EASE.out });
    const moveY = gsap.quickTo(element, "y", { duration: DURATION, ease: EASE.out });

    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = event.clientX - centerX;
      const deltaY = event.clientY - centerY;

      if (Math.hypot(deltaX, deltaY) > RADIUS + Math.max(rect.width, rect.height) / 2) {
        moveX(0);
        moveY(0);
        return;
      }

      moveX(deltaX * PULL);
      moveY(deltaY * PULL);
    };

    const onLeave = () => {
      gsap.to(element, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    element.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf(element);
      gsap.set(element, { x: 0, y: 0 });
    };
  }, [reduced, fine]);

  return (
    <span ref={scope} className={clsx("inline-block", className)}>
      {children}
    </span>
  );
}
