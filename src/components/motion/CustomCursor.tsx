"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, EASE, clamp } from "@/lib/motion";
import { useReducedMotion, useMediaQuery } from "@/lib/useReducedMotion";
import { cursor } from "@/content/de";

type CursorState = "default" | "link" | "drag" | "hidden";

/**
 * A3 — two-part cursor: a dot that tracks the pointer 1:1 and a ring that lags
 * behind it. Elements opt into a state with `data-cursor="link|drag|hidden"`.
 *
 * Mounted only for fine pointers with motion enabled; touch and reduced-motion
 * users keep the system cursor, and every `data-cursor` element is a real
 * button or link so nothing depends on this being present.
 */
export function CustomCursor() {
  const reduced = useReducedMotion();
  const fine = useMediaQuery("(pointer: fine)");
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CursorState>("default");
  const enabled = reduced === false && fine === true;

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const dotX = gsap.quickTo(dot, "x", { duration: 0.1, ease: EASE.out });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.1, ease: EASE.out });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.35, ease: EASE.out });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.35, ease: EASE.out });

    let visible = false;

    const onMove = (event: PointerEvent) => {
      if (!visible) {
        visible = true;
        gsap.to([dot, ring], { autoAlpha: 1, duration: 0.2, ease: EASE.out });
      }
      dotX(event.clientX);
      dotY(event.clientY);
      ringX(event.clientX);
      ringY(event.clientY);

      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor]");
      const next = (target?.dataset.cursor as CursorState | undefined) ?? "default";
      setState((current) => (current === next ? current : next));
    };

    const onLeave = () => {
      visible = false;
      gsap.to([dot, ring], { autoAlpha: 0, duration: 0.2, ease: EASE.out });
    };

    // Keyboard users get the same affordance when focus lands on a card.
    const onFocus = (event: FocusEvent) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor]");
      setState((target?.dataset.cursor as CursorState | undefined) ?? "default");
    };

    gsap.set([dot, ring], { autoAlpha: 0, xPercent: -50, yPercent: -50 });
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("focusin", onFocus);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("focusin", onFocus);
      gsap.killTweensOf([dot, ring]);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    const scales: Record<CursorState, number> = {
      default: 1,
      link: 1.8,
      drag: 2.2,
      hidden: 0,
    };

    gsap.to(ring, {
      scale: clamp(scales[state], 0, 3),
      duration: 0.4,
      ease: EASE.out,
    });
    gsap.to(dot, {
      scale: state === "drag" || state === "hidden" ? 0 : 1,
      duration: 0.3,
      ease: EASE.out,
    });
  }, [state, enabled]);

  if (!enabled) return null;

  const label = state === "drag" ? cursor.dragHint : "";
  const filled = state === "drag";

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[150]">
      <div
        ref={ringRef}
        className="absolute left-0 top-0 grid h-10 w-10 place-items-center rounded-full border transition-colors duration-300"
        style={{
          mixBlendMode: filled ? "normal" : "difference",
          borderColor: filled ? "var(--amber)" : "var(--cream)",
          backgroundColor: filled ? "var(--amber)" : "transparent",
        }}
      >
        <span
          className="t-mono whitespace-nowrap"
          style={{
            color: "var(--ink)",
            fontSize: "5px",
            letterSpacing: "0.14em",
            opacity: filled ? 1 : 0,
            transition: "opacity 0.25s ease",
          }}
        >
          {label}
        </span>
      </div>
      <div
        ref={dotRef}
        className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: "var(--cream)", mixBlendMode: "difference" }}
      />
    </div>
  );
}
