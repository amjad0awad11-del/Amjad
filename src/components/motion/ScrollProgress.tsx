"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, EASE, registerGsap } from "@/lib/motion";
import { sectionIndex, a11y } from "@/content/de";

/**
 * A30 — hairline progress bar on the right edge with the active section's name.
 *
 * Decorative and aria-hidden: the same information is available from the
 * document outline and the nav, so this never becomes the only way to know
 * where you are.
 */
export function ScrollProgress({ reduced }: { reduced: boolean }) {
  const bar = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [label, setLabel] = useState(sectionIndex[0]?.label ?? "");

  useEffect(() => {
    registerGsap();
    const element = bar.current;
    if (!element) return;

    gsap.set(element, { scaleY: 0, transformOrigin: "top center" });

    const progress = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => gsap.set(element, { scaleY: self.progress }),
    });

    const triggers = sectionIndex
      .map(({ id, label: name }) => {
        const section = document.getElementById(id);
        if (!section) return null;
        const set = () => setLabel(name);
        return ScrollTrigger.create({
          trigger: section,
          start: "top 50%",
          end: "bottom 50%",
          onEnter: set,
          onEnterBack: set,
        });
      })
      .filter(Boolean) as ScrollTrigger[];

    return () => {
      progress.kill();
      triggers.forEach((trigger) => trigger.kill());
    };
  }, []);

  // Swap the label with a short mask slide rather than a hard cut.
  useEffect(() => {
    const element = labelRef.current;
    if (!element || reduced) return;
    gsap.fromTo(
      element,
      { yPercent: 100, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 0.3, ease: EASE.out }
    );
  }, [label, reduced]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed right-0 top-0 z-[95] flex h-full w-[max(14px,var(--page-x))] flex-col items-center justify-center"
      data-qa-transient
    >
      <div className="flex flex-col items-center gap-5">
        {/* Vertical text needs a tall mask; a short one clips the label to two glyphs. */}
        <span className="hidden h-32 overflow-hidden lg:block">
          <span
            ref={labelRef}
            className="t-mono block whitespace-nowrap"
            style={{ color: "var(--muted)", writingMode: "vertical-rl" }}
          >
            {label}
          </span>
        </span>
        <span className="relative block h-24 w-px lg:h-32" style={{ backgroundColor: "var(--hairline)" }}>
          <span
            ref={bar}
            className="absolute inset-0 block origin-top"
            style={{ backgroundColor: "var(--amber)" }}
          />
        </span>
      </div>
      <span className="sr-only">{a11y.progressLabel}</span>
    </div>
  );
}
