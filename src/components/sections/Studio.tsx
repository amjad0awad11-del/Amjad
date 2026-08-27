"use client";

import { RevealText } from "@/components/motion/RevealText";
import { RevealMedia } from "@/components/motion/RevealMedia";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Counter } from "@/components/motion/Counter";
import { studio } from "@/content/de";
import { isPlaceholder } from "@/lib/placeholder";

/** Counts up only when the supplied value actually starts with a number. */
function Stat({ value, label }: { value: string; label: string }) {
  const match = value.match(/^(\d[\d.]*)(.*)$/);
  const placeholder = isPlaceholder(value);

  return (
    <div className="flex flex-col-reverse gap-2 border-t pt-5" style={{ borderColor: "var(--hairline)" }}>
      <dt className="t-mono t-muted">{label}</dt>
      <dd
        className={placeholder ? "t-h3 m-0 break-words" : "t-h2 m-0"}
        style={{ color: "var(--accent)", opacity: placeholder ? 0.7 : 1 }}
        data-placeholder={placeholder ? "stat" : undefined}
      >
        {match ? (
          <>
            <Counter value={Number(match[1].replace(/\./g, ""))} />
            {match[2]}
          </>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

/** S11 — Studio: values, stats (A18) and the staggered asset grid (A28/A11). */
export function Studio() {
  return (
    <section id={studio.id} data-theme="light" aria-labelledby="studio-title" className="section-y">
      <div className="wrap flex flex-col gap-16">
        <SectionHeader label={studio.label} title={studio.title} titleId="studio-title" />

        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <RevealText as="p" className="t-body">
              {studio.body}
            </RevealText>
          </div>

          <ul className="flex flex-col gap-6 lg:col-span-5 lg:col-start-8">
            {studio.values.map((value) => (
              <li
                key={value.title}
                className="flex flex-col gap-2 border-t pt-5"
                style={{ borderColor: "var(--hairline)" }}
              >
                <h3 className="t-h3">{value.title}</h3>
                <p className="t-body t-muted">{value.text}</p>
              </li>
            ))}
          </ul>
        </div>

        <dl className="grid gap-8 sm:grid-cols-3">
          {studio.stats.map((stat) => (
            <Stat key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </dl>

        {/* A28 — alternating parallax so the grid breathes on the way past. */}
        <ul className="grid grid-cols-2 gap-[var(--gutter)] lg:grid-cols-4">
          {studio.grid.map((item, index) => (
            <li key={item.src} data-parallax={item.parallax}>
              <RevealMedia className="aspect-[4/3] w-full" delay={index * 0.12}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  data-reveal-inner
                  src={item.src}
                  alt={item.alt}
                  width={1200}
                  height={900}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </RevealMedia>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
