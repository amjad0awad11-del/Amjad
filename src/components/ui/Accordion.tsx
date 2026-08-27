"use client";

import { useEffect, useId, useRef } from "react";
import { gsap, EASE, prefersReducedMotion } from "@/lib/motion";

/**
 * A23 — one row of the FAQ accordion.
 *
 * Height animates to auto with GSAP while the answer settles in; the plus turns
 * 45° into a cross. `aria-expanded`/`aria-controls` and `hidden` are wired so
 * the state is real, not just visual.
 */
export function AccordionItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const icon = useRef<HTMLSpanElement>(null);
  const first = useRef(true);
  const id = useId();

  useEffect(() => {
    const element = panel.current;
    const content = inner.current;
    if (!element || !content) return;

    const reduced = prefersReducedMotion();
    const duration = first.current || reduced ? 0 : 0.5;

    gsap.to(icon.current, { rotate: open ? 45 : 0, duration: duration ? 0.35 : 0, ease: EASE.inOut });

    gsap.to(element, {
      height: open ? content.offsetHeight : 0,
      duration,
      ease: EASE.inOut,
      // Let the panel size itself again once it is open, so reflow is safe.
      onComplete: () => {
        if (open) gsap.set(element, { height: "auto" });
      },
    });

    if (open && duration > 0) {
      gsap.fromTo(
        content,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.4, ease: EASE.out, delay: 0.1 }
      );
    } else if (!open) {
      gsap.set(content, { autoAlpha: 1, y: 0 });
    }

    first.current = false;
  }, [open]);

  return (
    <li className="group relative border-t last:border-b" style={{ borderColor: "var(--hairline)" }}>
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 h-full w-0.5 origin-top scale-y-0 transition-transform duration-300 group-hover:scale-y-100 group-focus-within:scale-y-100"
        style={{ backgroundColor: "var(--accent)" }}
      />
      <h3 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          id={`${id}-button`}
          onClick={onToggle}
          data-cursor="link"
          className="flex w-full items-start justify-between gap-8 py-7 pl-4 pr-1 text-left"
        >
          <span className="t-h3 max-w-[38ch]">{question}</span>
          <span
            ref={icon}
            aria-hidden="true"
            className="relative mt-2 block h-4 w-4 shrink-0"
            style={{ color: "var(--accent)" }}
          >
            <span className="absolute left-0 top-1/2 block h-px w-4" style={{ backgroundColor: "currentColor" }} />
            <span className="absolute left-1/2 top-0 block h-4 w-px" style={{ backgroundColor: "currentColor" }} />
          </span>
        </button>
      </h3>

      <div
        ref={panel}
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-button`}
        // Every panel ships open, so answers are readable with JS disabled.
        // GSAP takes ownership of the height on mount and closes the inactive
        // ones instantly; React never rewrites this style, so nothing fights it.
        style={{ overflow: "hidden" }}
      >
        <div ref={inner} className="t-body t-muted pb-8 pl-4 pr-8">
          {answer}
        </div>
      </div>
    </li>
  );
}
