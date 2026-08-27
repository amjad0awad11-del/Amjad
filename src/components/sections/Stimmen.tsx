"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, Observer, EASE, prefersReducedMotion } from "@/lib/motion";
import { RevealText } from "@/components/motion/RevealText";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { stimmen, a11y } from "@/content/de";
import { isPlaceholder } from "@/lib/placeholder";

const AUTOPLAY_MS = 6000;

/**
 * S10 — Stimmen (A22).
 *
 * Drag, wheel, arrow keys and dots all move the slider; it auto-advances every
 * six seconds and pauses on hover or focus. All quotes stay in the DOM and only
 * the active one is exposed, so the section is readable without JS.
 *
 * The quotes are [[PLACEHOLDER]] tokens until real, approved ones arrive — the
 * section renders them visibly rather than inventing names.
 */
export function Stimmen() {
  const scope = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = stimmen.items.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count]
  );

  // Auto-advance, paused while the section has hover or focus.
  useEffect(() => {
    if (paused || count < 2) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, count]);

  // Drag / horizontal wheel.
  useEffect(() => {
    const element = stage.current;
    if (!element || prefersReducedMotion()) return;

    const observer = Observer.create({
      target: element,
      type: "wheel,touch,pointer",
      preventDefault: false,
      tolerance: 40,
      onLeft: () => go(index + 1),
      onRight: () => go(index - 1),
    });

    return () => observer.kill();
  }, [index, go]);

  // Outgoing quote slides away; the incoming one is revealed by RevealText.
  useEffect(() => {
    const element = stage.current;
    if (!element || prefersReducedMotion()) return;
    gsap.fromTo(
      element,
      { xPercent: -8, autoAlpha: 0 },
      { xPercent: 0, autoAlpha: 1, duration: 0.4, ease: EASE.out }
    );
  }, [index]);

  const active = stimmen.items[index];

  return (
    <section
      ref={scope}
      id={stimmen.id}
      data-theme="dark"
      aria-labelledby="stimmen-title"
      className="section-y"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="wrap flex flex-col gap-16">
        <SectionHeader label={stimmen.label} title={stimmen.title} titleId="stimmen-title" />

        <div
          role="group"
          aria-roledescription={a11y.sliderRoleDescription}
          aria-label={stimmen.title}
          tabIndex={0}
          data-cursor="drag"
          className="outline-offset-8"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              go(index + 1);
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              go(index - 1);
            }
          }}
        >
          <div ref={stage} className="min-h-[clamp(220px,26vh,320px)]">
            <figure
              key={index}
              aria-roledescription="Folie"
              aria-label={`${index + 1} von ${count}`}
              className="flex flex-col gap-8"
            >
              <RevealText
                as="blockquote"
                className={
                  isPlaceholder(active.quote)
                    ? "t-h3 max-w-[24ch]"
                    : "t-h2 max-w-[24ch]"
                }
                immediate
                key={`quote-${index}`}
              >
                {active.quote}
              </RevealText>
              <figcaption className="flex flex-col gap-1">
                <span
                  className="t-mono"
                  data-placeholder={isPlaceholder(active.name) ? "name" : undefined}
                >
                  {active.name}
                </span>
                <span className="t-mono t-muted">{active.role}</span>
              </figcaption>
            </figure>
          </div>

          <div className="mt-10 flex items-center gap-6">
            <ul className="flex items-center gap-2">
              {stimmen.items.map((item, dot) => (
                <li key={item.name + dot}>
                  <button
                    type="button"
                    aria-label={`${a11y.sliderGoTo} ${dot + 1}`}
                    aria-current={dot === index}
                    data-cursor="link"
                    onClick={() => go(dot)}
                    className="grid h-11 place-items-center px-1"
                  >
                    <span
                      className="block h-0.5 rounded-full transition-[width,background-color] duration-300"
                      style={{
                        width: dot === index ? 32 : 8,
                        backgroundColor: dot === index ? "var(--accent)" : "var(--muted)",
                      }}
                    />
                  </button>
                </li>
              ))}
            </ul>

            <p className="t-mono t-muted" aria-live="polite">
              {index + 1} / {count}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
