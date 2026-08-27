"use client";

import { useRef } from "react";
import { gsap, EASE, START, DESKTOP_QUERY } from "@/lib/motion";
import { useGsap } from "@/lib/useGsap";
import { RevealText } from "@/components/motion/RevealText";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { prozess } from "@/content/de";

/**
 * S7 — Prozess.
 *
 * A19: on desktop the section pins for 300% of its height while the big step
 * number cross-fades and the matching text brightens, with an amber progress
 * line drawing down the side. Below 1024px and under reduced motion the steps
 * are a plain stacked list with the standard reveals — no pin.
 */
export function Prozess() {
  const scope = useRef<HTMLElement>(null);

  useGsap(
    () => {
      const root = scope.current;
      if (!root) return;

      const context = gsap.matchMedia();

      context.add(
        { desktop: `${DESKTOP_QUERY} and (prefers-reduced-motion: no-preference)` },
        (state) => {
          if (!state.conditions?.desktop) return;

          const numbers = gsap.utils.toArray<HTMLElement>("[data-step-number]", root);
          const steps = gsap.utils.toArray<HTMLElement>("[data-step]", root);
          const line = root.querySelector<HTMLElement>("[data-step-line]");
          if (numbers.length === 0) return;

          // The brief dims inactive steps to opacity 0.25. On the cream ground
          // that puts body text at 1.4:1 and the amber index below 2:1, and no
          // opacity value clears 4.5:1 for both. Recede them by colour instead:
          // muted (4.7:1) for inactive, full foreground and accent for active.
          // --theme-fg is this section's own foreground. --fg is the body-level
          // token the theme morph animates, which at mount still holds the
          // previous section's colour.
          const styles = getComputedStyle(root);
          const MUTED = styles.getPropertyValue("--muted").trim();
          const FG = styles.getPropertyValue("--theme-fg").trim();
          const ACCENT = styles.getPropertyValue("--accent").trim();

          const body = (step: HTMLElement) =>
            Array.from(step.querySelectorAll<HTMLElement>("h3, p:not([data-step-no])"));
          const index_ = (step: HTMLElement) => step.querySelector<HTMLElement>("[data-step-no]");

          gsap.set(numbers.slice(1), { yPercent: 60, autoAlpha: 0 });
          gsap.set(numbers[0], { yPercent: 0, autoAlpha: 1 });
          steps.slice(1).forEach((step) => {
            gsap.set(body(step), { color: MUTED });
            gsap.set(index_(step), { color: MUTED });
          });
          if (line) gsap.set(line, { scaleY: 0, transformOrigin: "top center" });

          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: root,
              start: START.pin,
              end: "+=300%",
              scrub: 1,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          steps.forEach((_, index) => {
            if (index === 0) return;
            const at = index - 1;
            timeline
              .to(numbers[at], { yPercent: -60, autoAlpha: 0, duration: 0.5, ease: EASE.expo }, at)
              .to(numbers[index], { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: EASE.expo }, at)
              .to(body(steps[at]), { color: MUTED, duration: 0.4 }, at)
              .to(index_(steps[at]), { color: MUTED, duration: 0.4 }, at)
              .to(body(steps[index]), { color: FG, duration: 0.4 }, at)
              .to(index_(steps[index]), { color: ACCENT, duration: 0.4 }, at);
          });

          if (line) {
            gsap.to(line, {
              scaleY: 1,
              ease: EASE.linear,
              scrollTrigger: {
                trigger: root,
                start: START.pin,
                end: "+=300%",
                scrub: true,
                invalidateOnRefresh: true,
              },
            });
          }

          return () => timeline.kill();
        }
      );

      return () => context.revert();
    },
    scope,
    []
  );

  return (
    <section
      ref={scope}
      id={prozess.id}
      data-theme="light"
      aria-labelledby="prozess-title"
      className="section-y overflow-hidden"
    >
      <div className="wrap flex flex-col gap-16">
        <SectionHeader label={prozess.label} title={prozess.title} titleId="prozess-title" />

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          {/* The cross-fading numeral stack. Decorative — each step repeats its
              own number in the heading below. */}
          <div className="relative hidden lg:col-span-4 lg:block" aria-hidden="true">
            <div className="relative h-[clamp(140px,18vw,260px)]">
              {prozess.steps.map((step) => (
                <span
                  key={step.no}
                  data-step-number
                  className="absolute inset-0 t-display leading-none"
                  style={{ color: "var(--accent)" }}
                >
                  {step.no}
                </span>
              ))}
            </div>
          </div>

          <div className="relative lg:col-span-8">
            <span
              className="absolute left-0 top-0 hidden h-full w-px lg:block"
              style={{ backgroundColor: "var(--hairline)" }}
            >
              <span
                data-step-line
                className="block h-full w-px origin-top"
                style={{ backgroundColor: "var(--accent)", transform: "scaleY(0)" }}
              />
            </span>

            <ol className="flex flex-col gap-12 lg:pl-10">
              {prozess.steps.map((step) => (
                <li key={step.no} data-step className="flex flex-col gap-3">
                  <p data-step-no className="t-mono" style={{ color: "var(--accent)" }}>
                    {step.no}
                  </p>
                  <RevealText as="h3" className="t-h3">
                    {step.title}
                  </RevealText>
                  <RevealText as="p" className="t-body t-muted" delay={0.05}>
                    {step.text}
                  </RevealText>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
