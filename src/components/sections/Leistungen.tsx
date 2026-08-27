"use client";

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
  const previews = leistungen.items.map((item) => ({
    src: item.preview.replace("/media/", "/images/").replace(".mp4", ".jpg"),
    alt: item.previewAlt,
  }));

  return (
    <section
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
              className="border-t last:border-b"
              style={{ borderColor: "var(--hairline)" }}
            >
              <div className="grid gap-6 py-10 lg:grid-cols-12 lg:gap-8">
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
