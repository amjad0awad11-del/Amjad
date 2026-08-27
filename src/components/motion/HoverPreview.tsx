"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, EASE, clamp } from "@/lib/motion";
import { useReducedMotion, useMediaQuery } from "@/lib/useReducedMotion";

type PreviewItem = { src: string; alt: string };

/**
 * A29 — floating hover preview.
 *
 * A single 16:9 card follows the pointer and swaps its image as rows are
 * hovered; rows opt in with `data-preview-index`. Hidden on touch and under
 * reduced motion, and never the only way to reach information.
 */
export function HoverPreview({ items, scopeSelector }: { items: PreviewItem[]; scopeSelector: string }) {
  const card = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const fine = useMediaQuery("(pointer: fine)");
  const enabled = reduced === false && fine === true;

  useEffect(() => {
    if (!enabled) return;
    const element = card.current;
    const root = document.querySelector<HTMLElement>(scopeSelector);
    if (!element || !root) return;

    const moveX = gsap.quickTo(element, "x", { duration: 0.5, ease: EASE.out });
    const moveY = gsap.quickTo(element, "y", { duration: 0.5, ease: EASE.out });
    const rotate = gsap.quickTo(element, "rotate", { duration: 0.5, ease: EASE.out });

    let lastX = 0;
    gsap.set(element, { autoAlpha: 0, scale: 0.9 });

    const onMove = (event: PointerEvent) => {
      const row = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-preview-index]");
      const next = row ? Number(row.dataset.previewIndex) : null;
      setIndex((current) => (current === next ? current : next));

      if (next === null) return;
      moveX(event.clientX + 24);
      moveY(event.clientY + 24);
      // Lean with horizontal pointer velocity.
      rotate(clamp((event.clientX - lastX) * 0.4, -6, 6));
      lastX = event.clientX;
    };

    const onLeave = () => setIndex(null);

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf(element);
    };
  }, [enabled, scopeSelector]);

  useEffect(() => {
    if (!enabled) return;
    const element = card.current;
    if (!element) return;
    gsap.to(element, {
      autoAlpha: index === null ? 0 : 1,
      scale: index === null ? 0.9 : 1,
      duration: 0.35,
      ease: EASE.out,
    });
  }, [index, enabled]);

  if (!enabled) return null;

  const item = index === null ? null : items[index];

  return (
    <div
      ref={card}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[110] w-[280px] overflow-hidden rounded-[var(--r-media)]"
      style={{ visibility: "hidden" }}
    >
      {item && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={item.src} alt="" className="h-[180px] w-[280px] object-cover" width={280} height={180} />
      )}
    </div>
  );
}
