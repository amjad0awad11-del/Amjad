import Image from "next/image";
import { ParallaxMedia } from "@/components/motion/ParallaxMedia";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ueberUns } from "@/content/cafe";

/**
 * "Mit Liebe für Moers gemacht." — a sincere, human story section.
 *
 * Every sentence here is covered by the confirmed offer and the confirmed
 * location. No founding year, no family history, no awards: none of that could
 * be verified, so none of it is claimed.
 */
export function UeberUns() {
  return (
    <section
      id="ueber-uns"
      aria-labelledby="ueber-uns-heading"
      className="section relative"
    >
      <div className="shell grid items-center gap-10 lg:grid-cols-[0.9fr_1fr] lg:gap-16">
        <div data-reveal className="relative order-2 lg:order-1">
          <ParallaxMedia className="rounded-[var(--r-media-lg)] shadow-[var(--shadow-lg)]">
            <Image
              src={ueberUns.image.src}
              alt={ueberUns.image.alt}
              width={ueberUns.image.width}
              height={ueberUns.image.height}
              sizes="(max-width: 1023px) 100vw, 46vw"
              className="h-full w-full object-cover"
            />
          </ParallaxMedia>

          {/* Caramel hairline frame, offset — a print-like registration mark. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-4 -top-4 -z-10 h-28 w-28 rounded-tr-[var(--r-media-lg)] border-r border-t border-[color-mix(in_srgb,var(--caramel)_70%,transparent)]"
          />
        </div>

        <div className="order-1 flex flex-col gap-7 lg:order-2">
          <SectionHeader
            eyebrow={ueberUns.eyebrow}
            heading={ueberUns.heading}
            id="ueber-uns-heading"
          />

          <div className="flex max-w-[58ch] flex-col gap-5" data-reveal>
            {ueberUns.paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 32)}
                className="text-[length:var(--fs-body)] leading-[1.7] text-[var(--muted)]"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <dl className="grid gap-5 sm:grid-cols-3" data-reveal>
            {ueberUns.values.map((value) => (
              <div
                key={value.title}
                className="flex flex-col gap-1.5 border-t border-[var(--hairline-strong)] pt-4"
              >
                <dt className="font-display text-[1.0625rem] text-[var(--espresso)]">
                  {value.title}
                </dt>
                <dd className="text-[0.875rem] leading-[1.6] text-[var(--muted)]">
                  {value.text}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
