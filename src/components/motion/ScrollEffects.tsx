"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger, EASE, registerGsap, prefersReducedMotion, velocityToSkew } from "@/lib/motion";

/**
 * A12 + A13 — page-wide scroll effects, wired once instead of per component.
 *
 * `data-parallax="0.15"` drifts an element against the scroll; `data-skew`
 * leans a media container with scroll velocity. Both are skipped entirely under
 * reduced motion, and both only ever touch transforms.
 */
export function ScrollEffects() {
  useEffect(() => {
    registerGsap();
    if (prefersReducedMotion()) return;

    const context = gsap.context(() => {
      // A12 — parallax
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((element) => {
        const strength = Number.parseFloat(element.dataset.parallax ?? "0.1");
        if (!Number.isFinite(strength) || strength === 0) return;

        gsap.fromTo(
          element,
          { yPercent: strength * 100 },
          {
            yPercent: -strength * 100,
            ease: EASE.linear,
            scrollTrigger: {
              trigger: element,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          }
        );
      });

      // A13 — velocity skew on media
      const skewables = gsap.utils.toArray<HTMLElement>("[data-skew]");
      if (skewables.length > 0) {
        const setters = skewables.map((element) =>
          gsap.quickTo(element, "skewY", { duration: 0.5, ease: EASE.out })
        );

        let idle: ReturnType<typeof setTimeout>;
        ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: (self) => {
            const skew = velocityToSkew(self.getVelocity(), 4);
            setters.forEach((set) => set(skew));
            clearTimeout(idle);
            idle = setTimeout(() => setters.forEach((set) => set(0)), 160);
          },
        });
      }
    });

    return () => context.revert();
  }, []);

  return null;
}
