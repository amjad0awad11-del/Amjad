"use client";

import { useRef } from "react";
import { gsap, DUR, EASE, STAGGER, START, prefersReducedMotion, simpleFade } from "@/lib/motion";
import { useGsap } from "@/lib/useGsap";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { vergleich } from "@/content/de";

/** Amber tick drawn as a path so it needs no icon font and no emoji. */
function Check() {
  return (
    <svg
      data-check
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      className="mt-[0.45em] shrink-0"
      style={{ color: "var(--accent)" }}
    >
      <path
        d="M2.5 8.5 L6.5 12.5 L13.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * S8 — Vergleich.
 *
 * A real <table> so the comparison is navigable by screen reader; the AMW
 * column carries an amber tint and a drawn underline (A20). On narrow screens
 * it scrolls inside its own container rather than pushing the page sideways.
 */
export function Vergleich() {
  const scope = useRef<HTMLElement>(null);

  useGsap(
    () => {
      const root = scope.current;
      if (!root) return;
      const rows = gsap.utils.toArray<HTMLElement>("[data-row]", root);
      const rule = root.querySelector<HTMLElement>("[data-amw-rule]");
      const checks = gsap.utils.toArray<HTMLElement>("[data-check]", root);

      if (prefersReducedMotion()) {
        simpleFade(rows, { scrollTrigger: { trigger: root, start: START.default, once: true } });
        return;
      }

      gsap.set(rows, { autoAlpha: 0, y: 24 });
      gsap.to(rows, {
        autoAlpha: 1,
        y: 0,
        duration: DUR.base,
        ease: EASE.out,
        stagger: STAGGER.cards / 2,
        scrollTrigger: { trigger: root, start: START.default, once: true },
      });

      if (rule) {
        gsap.set(rule, { scaleX: 0, transformOrigin: "left center" });
        gsap.to(rule, {
          scaleX: 1,
          duration: DUR.base,
          ease: EASE.expo,
          scrollTrigger: { trigger: root, start: START.default, once: true },
        });
      }

      gsap.set(checks, { scale: 0 });
      gsap.to(checks, {
        scale: 1,
        duration: 0.5,
        ease: EASE.pop,
        stagger: 0.05,
        scrollTrigger: { trigger: root, start: START.default, once: true },
      });
    },
    scope,
    []
  );

  return (
    <section
      ref={scope}
      id={vergleich.id}
      data-theme="dark"
      aria-labelledby="vergleich-title"
      className="section-y"
    >
      <div className="wrap flex flex-col gap-16">
        <SectionHeader label={vergleich.label} title={vergleich.title} titleId="vergleich-title" />

        <div className="-mx-[var(--page-x)] overflow-x-auto px-[var(--page-x)]">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <caption className="sr-only">{vergleich.title}</caption>
            <thead>
              <tr data-row>
                <th scope="col" className="t-mono t-muted w-[22%] pb-5 pr-6 align-bottom font-medium">
                  {vergleich.criterionLabel}
                </th>
                {vergleich.columns.map((column, index) => (
                  <th
                    key={column}
                    scope="col"
                    className="t-h3 pb-5 pr-6 align-bottom font-medium"
                    style={{
                      color: index === 0 ? "var(--accent)" : "var(--muted)",
                      backgroundColor:
                        index === 0 ? "color-mix(in srgb, var(--amber) 7%, transparent)" : undefined,
                    }}
                  >
                    <span className="relative inline-block px-2">
                      {column}
                      {index === 0 && (
                        <span
                          data-amw-rule
                          aria-hidden="true"
                          className="absolute inset-x-0 -bottom-1 block h-0.5 origin-left"
                          style={{ backgroundColor: "var(--accent)", transform: "scaleX(0)" }}
                        />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vergleich.rows.map((row) => (
                <tr key={row.label} data-row className="border-t" style={{ borderColor: "var(--hairline)" }}>
                  <th scope="row" className="t-mono t-muted py-5 pr-6 align-top font-medium">
                    {row.label}
                  </th>
                  <td
                    className="py-5 pr-6 align-top"
                    style={{ backgroundColor: "color-mix(in srgb, var(--amber) 7%, transparent)" }}
                  >
                    <span className="flex gap-2.5 px-2">
                      <Check />
                      <span>{row.amw}</span>
                    </span>
                  </td>
                  <td className="t-muted py-5 pr-6 align-top">{row.agency}</td>
                  <td className="t-muted py-5 align-top">{row.freelancer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
