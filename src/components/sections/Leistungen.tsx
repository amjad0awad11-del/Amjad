"use client";

import { useRef } from "react";
import { gsap, DUR, EASE, DESKTOP_QUERY } from "@/lib/motion";
import { useGsap } from "@/lib/useGsap";
import { RevealText } from "@/components/motion/RevealText";
import { HoverPreview } from "@/components/motion/HoverPreview";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { leistungen } from "@/content/de";

/**
 * S5 — Leistungen.
 *
 * Five hairline-separated editorial rows. Hovering a row floats a preview card
 * (A29); the same image also sits inside the row on touch and small screens, so
 * nothing is hover-only.
 */
export function Leistungen() {
  const scope = useRef<HTMLElement>(null);

  useGsap(
    () => {
      const root = scope.current;
      if (!root) return;

      const context = gsap.matchMedia();

      // Desktop: each row rises and settles as the one before it recedes, so the
      // list reads as cards stacking rather than five equal blocks.
      context.add(
        { desktop: `${DESKTOP_QUERY} and (prefers-reduced-motion: no-preference)` },
        (state) => {
          if (!state.conditions?.desktop) return;
          const rows = gsap.utils.toArray<HTMLElement>("[data-service-row]", root);

          rows.forEach((row, index) => {
            gsap.fromTo(
              row,
              { yPercent: 8, autoAlpha: 0, scale: 0.98 },
              {
                yPercent: 0,
                autoAlpha: 1,
                scale: 1,
                duration: DUR.base,
                ease: EASE.expo,
                scrollTrigger: { trigger: row, start: "top 88%", once: true },
              }
            );

            // The row dims and drops back as it leaves the top of the viewport.
            // immediateRender:false matters here — without it GSAP captures the
            // start value while the entrance above still holds the row at
            // opacity 0, and the row never becomes visible again.
            if (index < rows.length - 1) {
              gsap.fromTo(
                row,
                { opacity: 1, scale: 1 },
                {
                  opacity: 0.35,
                  scale: 0.97,
                  ease: EASE.linear,
                  immediateRender: false,
                  scrollTrigger: {
                    trigger: row,
                    start: "top 22%",
                    end: "bottom 12%",
                    scrub: true,
                  },
                }
              );
            }
          });

          return () => {
            gsap.set(rows, { clearProps: "transform,opacity" });
          };
        }
      );

      return () => context.revert();
    },
    scope,
    []
  );

  const previews = leistungen.items.map((item) => ({
    src: item.preview.replace("/media/", "/images/").replace(".mp4", ".jpg"),
    alt: item.previewAlt,
  }));

  return (
    <section
      ref={scope}
      id={leistungen.id}
      data-theme="light"
      aria-labelledby="leistungen-title"
      className="section-y"
    >
      <div className="wrap flex flex-col gap-16">
        <SectionHeader
          label={leistungen.label}
          title={leistungen.title}
          titleId="leistungen-title"
        />

        <ul id="leistungen-liste" className="flex flex-col">
          {leistungen.items.map((item, index) => (
            <li
              key={item.no}
              data-preview-index={index}
              data-service-row
              className="border-t last:border-b"
              style={{ borderColor: "var(--hairline)" }}
            >
              <div
                className="grid gap-6 py-10 lg:grid-cols-12 lg:gap-8"
                style={{ backgroundColor: "var(--theme-bg)" }}
              >
                <p className="t-mono t-muted lg:col-span-1">{item.no}</p>

                <div className="lg:col-span-4">
                  <RevealText as="h3" className="t-h3 max-w-[14ch]">
                    {item.title}
                  </RevealText>
                </div>

                <div className="flex flex-col gap-5 lg:col-span-7">
                  <RevealText as="p" className="t-body t-muted" delay={0.05}>
                    {item.text}
                  </RevealText>
                  <ul className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <li
                        key={tag}
                        className="t-mono rounded-[var(--r-pill)] border px-3 py-1.5"
                        style={{ borderColor: "var(--hairline)", color: "var(--muted)" }}
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* The hover preview's tap/small-screen equivalent — on desktop
                    the floating card (A29) takes over and this column is gone. */}
                <div className="lg:hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previews[index].src}
                    alt={item.previewAlt}
                    width={280}
                    height={180}
                    loading="lazy"
                    className="aspect-video w-full max-w-[280px] rounded-[var(--r-media)] object-cover"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <HoverPreview items={previews} scopeSelector="#leistungen-liste" />
    </section>
  );
}
