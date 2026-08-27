"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import {
  gsap,
  ScrollTrigger,
  EASE,
  clamp,
  prefersReducedMotion,
  velocityToSkew,
} from "@/lib/motion";
import { useGsap } from "@/lib/useGsap";

type MarqueeProps = {
  children: ReactNode;
  className?: string;
  /** Seconds for one full pass. */
  duration?: number;
  ariaLabel?: string;
};

/**
 * A9 — velocity marquee.
 *
 * The track is duplicated so -100% lands exactly on the seam. Scroll velocity
 * speeds it up, flips its direction and skews it, then everything eases back to
 * rest. Under reduced motion the copy simply sits still.
 */
export function Marquee({ children, className, duration = 22, ariaLabel }: MarqueeProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGsap(
    () => {
      const root = scope.current;
      const track = root?.querySelector<HTMLElement>("[data-marquee-track]");
      if (!root || !track || prefersReducedMotion()) return;

      // Half speed below the desktop breakpoint (§8).
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

      const loop = gsap.to(track, {
        xPercent: -100,
        repeat: -1,
        ease: EASE.linear,
        duration: isDesktop ? duration : duration * 2,
      });

      const skewTo = gsap.quickTo(track, "skewX", { duration: 0.4, ease: EASE.out });

      const trigger = ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const velocity = self.getVelocity();
          const speed = clamp(1 + Math.abs(velocity) / 600, 0.5, 4);
          // Scrolling up runs the type the other way.
          loop.timeScale(self.direction === -1 ? -speed : speed);
          skewTo(velocityToSkew(velocity, 6, 260));
        },
      });

      // Settle back to the base speed and zero skew once scrolling stops.
      let idle: ReturnType<typeof setTimeout>;
      const settle = () => {
        clearTimeout(idle);
        idle = setTimeout(() => {
          gsap.to(loop, {
            timeScale: loop.timeScale() < 0 ? -1 : 1,
            duration: 0.6,
            ease: EASE.out,
          });
          skewTo(0);
        }, 180);
      };
      window.addEventListener("scroll", settle, { passive: true });

      return () => {
        clearTimeout(idle);
        window.removeEventListener("scroll", settle);
        trigger.kill();
        loop.kill();
      };
    },
    scope,
    [duration]
  );

  return (
    <div
      ref={scope}
      className={clsx("relative w-full overflow-hidden", className)}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
    >
      <div data-marquee-track className="flex w-max will-change-transform" aria-hidden={ariaLabel ? true : undefined}>
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
