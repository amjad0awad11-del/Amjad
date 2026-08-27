"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { gsap, EASE } from "@/lib/motion";
import { useGsap } from "@/lib/useGsap";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSmoothScroll } from "@/components/motion/SmoothScrollProvider";

type ButtonProps = {
  label: string;
  href: string;
  variant?: "solid" | "outline" | "ghost";
  className?: string;
  /** Renders a <button> instead of a link — used for the showreel trigger. */
  onClick?: () => void;
};

/**
 * A17 — roll-up label inside a magnetic wrapper.
 *
 * The label is stacked twice: on hover the top copy rolls out of its mask and
 * the duplicate rolls in behind it, while an amber fill wipes up from the
 * bottom. The duplicate is aria-hidden, so the accessible name stays singular.
 *
 * Once the fill is in, the label switches to the background colour — cream on
 * amber only reaches 2.2:1, ink on amber reaches 10.2:1.
 */
export function Button({ label, href, variant = "solid", className, onClick }: ButtonProps) {
  const scope = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);
  const { scrollTo } = useSmoothScroll();
  const isAnchor = href.startsWith("#");
  const filled = variant === "solid" || active;

  // The duplicate label is offset in CSS so it does not stack without JS.
  // GSAP has to restate that in its own units, or it reads the CSS translate as
  // pixels and the yPercent tween becomes a no-op.
  useGsap(
    () => {
      const bottom = scope.current?.querySelector("[data-label-bottom]");
      if (bottom) gsap.set(bottom, { yPercent: 100, y: 0, clearProps: "" });
    },
    scope,
    []
  );

  const play = (direction: 1 | -1) => {
    setActive(direction === 1);
    if (reduced !== false) return;
    const element = scope.current;
    if (!element) return;

    const top = element.querySelector("[data-label-top]");
    const bottom = element.querySelector("[data-label-bottom]");
    const fill = element.querySelector("[data-fill]");

    gsap.to(top, { yPercent: direction === 1 ? -100 : 0, duration: 0.45, ease: EASE.inOut });
    gsap.to(bottom, { yPercent: direction === 1 ? 0 : 100, duration: 0.45, ease: EASE.inOut });
    if (fill) {
      gsap.to(fill, {
        scaleY: direction === 1 ? 1 : 0,
        transformOrigin: direction === 1 ? "bottom center" : "top center",
        duration: 0.45,
        ease: EASE.inOut,
      });
    }
  };

  const styles = clsx(
    "relative isolate inline-flex min-h-[44px] items-center justify-center overflow-hidden",
    "rounded-[var(--r-pill)] px-7 py-3.5 t-mono transition-colors duration-300",
    variant === "solid" && "bg-[var(--accent)]",
    variant === "outline" && "border border-[var(--hairline)]",
    className
  );

  const inner = (
    <span ref={scope} className="contents">
      {variant !== "solid" && (
        <span
          data-fill
          aria-hidden="true"
          className="absolute inset-0 -z-10 origin-bottom"
          style={{ backgroundColor: "var(--accent)", transform: "scaleY(0)" }}
        />
      )}
      <span className="relative block overflow-hidden">
        <span data-label-top className="block">
          {label}
        </span>
        <span
          data-label-bottom
          aria-hidden="true"
          className="absolute inset-0 block"
          style={{ transform: "translateY(100%)" }}
        >
          {label}
        </span>
      </span>
    </span>
  );

  const handlers = {
    onMouseEnter: () => play(1),
    onMouseLeave: () => play(-1),
    onFocus: () => play(1),
    onBlur: () => play(-1),
    style: { color: filled ? "var(--bg)" : "var(--fg)" },
    className: styles,
    "data-cursor": "link",
  };

  if (onClick) {
    return (
      <MagneticButton>
        <button type="button" onClick={onClick} {...handlers}>
          {inner}
        </button>
      </MagneticButton>
    );
  }

  if (isAnchor) {
    return (
      <MagneticButton>
        <a
          href={href}
          {...handlers}
          onClick={(event) => {
            const target = document.querySelector(href);
            if (!target) return;
            event.preventDefault();
            scrollTo(href);
          }}
        >
          {inner}
        </a>
      </MagneticButton>
    );
  }

  return (
    <MagneticButton>
      <Link href={href} {...handlers}>
        {inner}
      </Link>
    </MagneticButton>
  );
}
