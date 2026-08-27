"use client";

import { useRef } from "react";
import clsx from "clsx";
import { gsap, EASE, START, prefersReducedMotion } from "@/lib/motion";
import { useGsap } from "@/lib/useGsap";

type CounterProps = {
  /** Target number. Non-numeric values should be rendered as plain text instead. */
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  /** German thousands separators for values above 999. */
  format?: boolean;
};

/**
 * A18 — counts up to `value` once its element enters the viewport.
 *
 * The final value is in the DOM from the first render, so it is correct for
 * screen readers, for reduced motion and if JS never runs.
 */
export function Counter({ value, prefix = "", suffix = "", className, format = true }: CounterProps) {
  const scope = useRef<HTMLSpanElement>(null);

  useGsap(
    () => {
      const element = scope.current;
      const number = element?.querySelector<HTMLElement>("[data-counter-value]");
      if (!element || !number || prefersReducedMotion()) return;

      const state = { current: 0 };
      const render = () =>
        (number.textContent = format
          ? Math.round(state.current).toLocaleString("de-DE")
          : String(Math.round(state.current)));

      gsap.to(state, {
        current: value,
        duration: 1.8,
        ease: EASE.out,
        snap: { current: 1 },
        onUpdate: render,
        scrollTrigger: { trigger: element, start: "top 85%", once: true },
      });

      gsap.set(state, { current: 0 });
      render();
    },
    scope,
    [value, format]
  );

  return (
    <span ref={scope} className={clsx("tabular-nums", className)}>
      {prefix}
      <span data-counter-value>{format ? value.toLocaleString("de-DE") : value}</span>
      {suffix}
    </span>
  );
}
