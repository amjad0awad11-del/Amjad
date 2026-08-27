"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap, EASE, prefersReducedMotion } from "@/lib/motion";

/**
 * A26 — amber curtain between routes.
 *
 * On a route change the curtain wipes up from the bottom, the scroll position
 * resets behind it, then it wipes away off the top. Under reduced motion it
 * never renders and navigation is instant.
 */
export function PageTransition() {
  const pathname = usePathname();
  const curtain = useRef<HTMLDivElement>(null);
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    const element = curtain.current;
    if (!element) return;

    // First paint: nothing to transition from.
    if (previousPath.current === null) {
      previousPath.current = pathname;
      return;
    }
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;

    if (prefersReducedMotion()) {
      window.scrollTo(0, 0);
      return;
    }

    const timeline = gsap.timeline();
    timeline
      .set(element, { transformOrigin: "bottom center", scaleY: 0, autoAlpha: 1 })
      .to(element, { scaleY: 1, duration: 0.6, ease: EASE.curtain })
      .add(() => window.scrollTo(0, 0))
      .set(element, { transformOrigin: "top center" })
      .to(element, { scaleY: 0, duration: 0.6, ease: EASE.curtain })
      .set(element, { autoAlpha: 0 });

    return () => {
      timeline.kill();
    };
  }, [pathname]);

  return (
    <div
      ref={curtain}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[160] origin-bottom"
      style={{ backgroundColor: "var(--amber)", transform: "scaleY(0)", visibility: "hidden" }}
    />
  );
}
