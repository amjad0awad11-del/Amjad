"use client";

import { useRef, useState } from "react";
import {
  gsap,
  ScrollTrigger,
  EASE,
  START,
  WIDE_QUERY,
  prefersReducedMotion,
} from "@/lib/motion";
import { useGsap } from "@/lib/useGsap";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { RevealText } from "@/components/motion/RevealText";
import { MediaLightbox, type LightboxItem } from "@/components/motion/MediaLightbox";
import { Button } from "@/components/ui/Button";
import { impressionen } from "@/content/de";

type GalleryItem = (typeof impressionen.items)[number];

/** One tilted frame. Clicking it hands the image to the lightbox. */
function Card({
  item,
  onOpen,
}: {
  item: GalleryItem;
  onOpen: (item: LightboxItem) => void;
}) {
  return (
    <li data-gallery-card style={{ rotate: `${item.rotate}deg` }}>
      <button
        type="button"
        onClick={() => onOpen({ src: item.src, alt: item.alt })}
        data-cursor="media"
        aria-label={`${impressionen.openLabel} — ${item.alt}`}
        className="media-frame group relative block aspect-square w-full max-w-[320px] cursor-pointer motion-safe:xl:w-[clamp(220px,20vw,320px)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.src}
          alt={item.alt}
          width={800}
          height={800}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="halftone pointer-events-none absolute inset-0" aria-hidden="true" />
      </button>
    </li>
  );
}

/**
 * S12 — Impressionen.
 *
 * The parallax gallery. On a wide screen the centre block pins for the
 * section's full 300vh with `pinSpacing: false`, so it holds still in the
 * middle of the viewport while two columns of frames drift up either side of it
 * at different speeds, straightening out as they travel. Clicking a frame opens
 * it.
 *
 * The threshold is 1280px rather than the usual 1024: the frames sit at the
 * outer edges and the heading lives between them, and below that width there is
 * not enough room in the middle for both. Under that — and under reduced motion
 * — none of it runs: the same six frames are a plain two-column grid beneath the
 * heading, and the section is only as tall as its content.
 *
 * The 300vh, the pinning height and the outer-edge alignment are all behind
 * `motion-safe:` as well as `xl:` — without the pin they would leave three
 * screens of empty section behind.
 */
export function Impressionen() {
  const scope = useRef<HTMLElement>(null);
  const [active, setActive] = useState<LightboxItem | null>(null);

  const columns = [impressionen.items.slice(0, 3), impressionen.items.slice(3)];

  useGsap(
    () => {
      const root = scope.current;
      if (!root || prefersReducedMotion()) return;

      const context = gsap.matchMedia();

      context.add({ wide: WIDE_QUERY }, (state) => {
        if (!state.conditions?.wide) return;

        const centre = root.querySelector<HTMLElement>("[data-gallery-centre]");
        const cols = gsap.utils.toArray<HTMLElement>("[data-gallery-col]", root);
        const cards = gsap.utils.toArray<HTMLElement>("[data-gallery-card]", root);

        // `pinSpacing: false` is what makes this work: the columns are laid out
        // against the section's own 300vh, so adding pin spacing on top would
        // stretch the section out from under them.
        const pin = centre
          ? ScrollTrigger.create({
              trigger: root,
              start: START.pin,
              end: "bottom bottom",
              pin: centre,
              pinSpacing: false,
            })
          : null;

        const drift = { trigger: root, start: "top bottom", end: "bottom top", scrub: true } as const;

        // The two columns travel different distances against the same scroll,
        // which is the whole effect — one column outruns the other.
        cols.forEach((column, index) => {
          gsap.to(column, {
            yPercent: index === 0 ? -14 : -30,
            ease: EASE.linear,
            scrollTrigger: { ...drift, invalidateOnRefresh: true },
          });
        });

        // Each frame unwinds its resting tilt on the way through.
        const spins = cards.map((card) =>
          gsap.to(card, { rotate: 0, ease: EASE.linear, scrollTrigger: drift })
        );

        return () => {
          pin?.kill();
          spins.forEach((spin) => spin.kill());
          gsap.set(cols, { clearProps: "transform" });
        };
      });

      return () => context.revert();
    },
    scope,
    []
  );

  return (
    <>
      <section
        ref={scope}
        id={impressionen.id}
        data-theme="dark"
        aria-labelledby="impressionen-title"
        className="section-y relative overflow-hidden motion-safe:xl:min-h-[300vh] motion-safe:xl:py-0"
      >
        {/* Layer 1 — the block that holds still. */}
        <div
          data-gallery-centre
          className="wrap relative z-10 flex flex-col items-center gap-8 text-center motion-safe:xl:h-[100dvh] motion-safe:xl:max-w-[520px] motion-safe:xl:justify-center"
        >
          <SectionHeader
            label={impressionen.label}
            title={impressionen.title}
            titleId="impressionen-title"
            align="center"
          />
          <RevealText as="p" className="t-body t-muted max-w-[46ch]">
            {impressionen.sub}
          </RevealText>
          <Button
            label={impressionen.cta.label}
            href={impressionen.cta.href}
            variant="outline"
          />
        </div>

        {/* Layer 2 — the frames that pass over it. */}
        <div className="mt-16 motion-safe:xl:absolute motion-safe:xl:inset-0 motion-safe:xl:z-20 motion-safe:xl:mt-0">
          <div className="wrap grid grid-cols-2 gap-6 sm:gap-10 motion-safe:xl:gap-40">
            {columns.map((column, index) => (
              <ul
                key={index}
                data-gallery-col
                className={`flex flex-col items-center gap-6 sm:gap-10 motion-safe:xl:gap-[26vh] ${
                  index === 0
                    ? "motion-safe:xl:items-start motion-safe:xl:pt-[30vh]"
                    : "motion-safe:xl:items-end motion-safe:xl:pt-[78vh]"
                }`}
              >
                {column.map((item) => (
                  <Card key={item.src} item={item} onOpen={setActive} />
                ))}
              </ul>
            ))}
          </div>
        </div>
      </section>

      <MediaLightbox item={active} onClose={() => setActive(null)} />
    </>
  );
}
