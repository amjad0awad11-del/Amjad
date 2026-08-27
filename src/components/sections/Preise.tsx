"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import { gsap, DUR, EASE, STAGGER, START, clamp, prefersReducedMotion, simpleFade } from "@/lib/motion";
import { useGsap } from "@/lib/useGsap";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { preise } from "@/content/de";
import { isPlaceholder } from "@/lib/placeholder";

type Plan = (typeof preise.plans)[number];

/**
 * A21 — pricing card.
 *
 * Pointer position drives a small 3D tilt and a radial glow fed by --mx/--my.
 * Skipped for coarse pointers and reduced motion; the card is a plain block
 * either way, so nothing depends on the tilt.
 */
function PlanCard({ plan }: { plan: Plan }) {
  const card = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const element = card.current;
    if (!element) return;
    if (prefersReducedMotion() || window.matchMedia("(pointer: coarse)").matches) return;

    const rotateX = gsap.quickTo(element, "rotationX", { duration: 0.5, ease: EASE.out });
    const rotateY = gsap.quickTo(element, "rotationY", { duration: 0.5, ease: EASE.out });

    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      rotateY(clamp((px - 0.5) * 12, -6, 6));
      rotateX(clamp((0.5 - py) * 12, -6, 6));
      element.style.setProperty("--mx", `${px * 100}%`);
      element.style.setProperty("--my", `${py * 100}%`);
    };

    const onLeave = () => {
      rotateX(0);
      rotateY(0);
      element.style.setProperty("--mx", "50%");
      element.style.setProperty("--my", "50%");
    };

    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerleave", onLeave);
    return () => {
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf(element);
    };
  }, []);

  return (
    <li
      ref={card}
      data-plan
      className={clsx(
        "relative flex flex-col gap-8 border p-8",
        plan.featured && "lg:-translate-y-4"
      )}
      style={{
        borderColor: plan.featured ? "var(--fg)" : "var(--hairline)",
        backgroundColor: "color-mix(in srgb, var(--bg) 55%, transparent)",
        transformStyle: "preserve-3d",
        perspective: "1000px",
        // The glow follows the pointer via the two custom properties above.
        backgroundImage:
          "radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--fg) 8%, transparent), transparent 70%)",
      }}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h3 className="t-mono">{plan.name}</h3>
          {plan.badge && (
            <span
              className="t-mono rounded-[var(--r-pill)] px-3 py-1"
              style={{ backgroundColor: "var(--fg)", color: "var(--bg)" }}
            >
              {plan.badge}
            </span>
          )}
        </div>
        <p className="t-body t-muted">{plan.tagline}</p>
      </div>

      <p className="flex flex-wrap items-baseline gap-2">
        {/* A real price is short and belongs at display size; an unfilled token
            is long, so it steps down a level and wraps instead of overflowing
            the card — while staying plainly visible. */}
        <span
          className={clsx(
            "min-w-0 break-words",
            isPlaceholder(plan.price) ? "t-h3 opacity-70" : "t-h2"
          )}
          data-placeholder={isPlaceholder(plan.price) ? "price" : undefined}
        >
          {plan.price}
        </span>
        <span className="t-mono t-muted">{plan.period}</span>
      </p>

      <ul className="flex flex-col gap-3 border-t pt-6" style={{ borderColor: "var(--hairline)" }}>
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-3">
            <span aria-hidden="true" className="t-mono mt-[0.35em]" style={{ color: "var(--accent)" }}>
              —
            </span>
            <span className="t-body">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-2">
        <Button label={plan.cta} href="#kontakt" variant={plan.featured ? "solid" : "outline"} />
      </div>
    </li>
  );
}

/** S9 — Preise. The amber section, the visual punch of the page. */
export function Preise() {
  const scope = useRef<HTMLElement>(null);

  useGsap(
    () => {
      const root = scope.current;
      if (!root) return;
      const cards = gsap.utils.toArray<HTMLElement>("[data-plan]", root);

      if (prefersReducedMotion()) {
        simpleFade(cards, { scrollTrigger: { trigger: root, start: START.default, once: true } });
        return;
      }

      gsap.set(cards, { autoAlpha: 0, y: 40 });
      gsap.to(cards, {
        autoAlpha: 1,
        y: 0,
        duration: DUR.base,
        ease: EASE.out,
        stagger: STAGGER.cards,
        scrollTrigger: { trigger: root, start: START.default, once: true },
      });
    },
    scope,
    []
  );

  return (
    <section
      ref={scope}
      id={preise.id}
      data-theme="amber"
      aria-labelledby="preise-title"
      className="section-y"
    >
      <div className="wrap flex flex-col gap-16">
        <SectionHeader label={preise.label} title={preise.title} titleId="preise-title" />

        <ul className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {preise.plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </ul>

        <p className="t-body t-muted max-w-[70ch]">{preise.note}</p>
      </div>
    </section>
  );
}
