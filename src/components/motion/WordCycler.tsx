"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { gsap, EASE } from "@/lib/motion";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { useReducedMotion } from "@/lib/useReducedMotion";

type WordCyclerProps = {
  words: readonly string[];
  /** Milliseconds each word is held before the next one takes over. */
  interval?: number;
  className?: string;
  /**
   * `swap` lifts the outgoing word out and drives the next one in from below
   * — the loading screen's rotating verbs. `fade` re-triggers the CSS
   * `role-fade-in` keyframe on every change, for the hero's role line.
   */
  variant?: "swap" | "fade";
};

/**
 * A word that changes on a timer.
 *
 * `swap` is the exit-then-enter sequence: the outgoing word is fully gone
 * before the next one starts, so the two never cross. `fade` simply remounts
 * the span, which replays its CSS animation from the top.
 *
 * Under reduced motion nothing rotates at all — the first word is rendered and
 * left alone, because a word that changes under the reader is exactly the kind
 * of movement that setting asks us to stop.
 */
export function WordCycler({
  words,
  interval = 900,
  className,
  variant = "swap",
}: WordCyclerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();
  const running = reduced === false && words.length > 1;

  // Drive the incoming word in. Written in a layout effect so the start state
  // lands before paint and the word never flashes at its resting position.
  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element || !running || variant !== "swap") return;
    gsap.fromTo(
      element,
      { y: 20, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.35, ease: EASE.out }
    );
  }, [index, running, variant]);

  // Hold, lift the current word out, then hand over to the next one.
  useEffect(() => {
    if (!running) return;
    const element = ref.current;

    const advance = () => setIndex((current) => (current + 1) % words.length);

    const timer = window.setTimeout(() => {
      if (!element || variant !== "swap") {
        advance();
        return;
      }
      gsap.to(element, {
        y: -20,
        autoAlpha: 0,
        duration: 0.3,
        ease: EASE.out,
        onComplete: advance,
      });
    }, interval);

    return () => window.clearTimeout(timer);
  }, [index, interval, running, variant, words.length]);

  // Remounting on `key` is what replays the CSS keyframe for the fade variant.
  return (
    <span
      key={variant === "fade" ? index : undefined}
      ref={ref}
      className={clsx(
        "inline-block",
        variant === "fade" && running && "animate-role-fade-in",
        className
      )}
    >
      {words[index] ?? words[0]}
    </span>
  );
}
