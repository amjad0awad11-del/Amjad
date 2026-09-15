import Image from "next/image";
import { Check } from "lucide-react";
import { ParallaxMedia } from "@/components/motion/ParallaxMedia";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { intro } from "@/content/cafe";

/**
 * Café introduction — the first thing after the hero, and the section that has
 * to make someone in Moers want to come by today.
 */
export function Intro() {
  return (
    <section
      id="einleitung"
      aria-labelledby="intro-heading"
      className="section relative"
    >
      <div className="shell grid items-center gap-10 lg:grid-cols-[1fr_0.82fr] lg:gap-16">
        <div className="flex flex-col gap-7">
          <SectionHeader
            eyebrow={intro.eyebrow}
            heading={intro.heading}
            id="intro-heading"
          />

          <div className="flex max-w-[58ch] flex-col gap-5" data-reveal>
            {intro.paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 32)}
                className="text-[length:var(--fs-body)] leading-[1.7] text-[var(--muted)]"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <ul className="flex flex-col gap-3" data-reveal>
            {intro.highlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--sage)_36%,transparent)] text-[var(--sage-deep)]"
                >
                  <Check size={13} strokeWidth={3} />
                </span>
                <span className="text-[0.9375rem] font-medium text-[var(--espresso)]">
                  {highlight}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Editorial portrait-format atmosphere shot. */}
        <div data-reveal className="relative">
          <ParallaxMedia className="rounded-[var(--r-media-lg)] shadow-[var(--shadow-lg)]">
            <Image
              src={intro.image.src}
              alt={intro.image.alt}
              width={intro.image.width}
              height={intro.image.height}
              // Below the fold: lazy by default, with the rendered width
              // declared so the browser picks the right candidate.
              sizes="(max-width: 1023px) 100vw, 44vw"
              className="h-full w-full object-cover"
            />
          </ParallaxMedia>

          {/* Warm sage plate behind the image — a flat tint, no glassmorphism. */}
          <div
            aria-hidden="true"
            className="absolute -bottom-5 -left-5 -z-10 h-32 w-32 rounded-[var(--r-media-lg)] bg-[color-mix(in_srgb,var(--sage)_42%,transparent)]"
          />
        </div>
      </div>
    </section>
  );
}
