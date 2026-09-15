"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { Expand } from "lucide-react";
import { Lightbox } from "@/components/sections/Lightbox";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { impressionen } from "@/content/cafe";
import { cn } from "@/lib/cn";

const { images, lightbox } = impressionen;

/**
 * "Ein Blick in unser Café." — editorial gallery.
 *
 * The tiles keep each image's declared aspect ratio, which is what stops the
 * grid from looking like a stock template, and reserving that ratio up front
 * means no layout shift as the photos arrive.
 *
 * Only the first two tiles are eager; everything below the fold is lazy.
 */
export function Impressionen() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // Remembering which thumbnail opened the lightbox is what lets focus return
  // exactly where the guest left it.
  const triggersRef = useRef<Array<HTMLButtonElement | null>>([]);

  const close = useCallback(() => {
    const previous = openIndex;
    setOpenIndex(null);
    if (previous !== null) {
      // Wait for the dialog to unmount before moving focus back.
      requestAnimationFrame(() => triggersRef.current[previous]?.focus());
    }
  }, [openIndex]);

  return (
    <section
      id="impressionen"
      aria-labelledby="impressionen-heading"
      className="section relative"
    >
      <div className="shell flex flex-col gap-12">
        <SectionHeader
          eyebrow={impressionen.eyebrow}
          heading={impressionen.heading}
          intro={impressionen.intro}
          id="impressionen-heading"
        />

        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {images.map((image, index) => (
            <li
              key={image.id}
              data-reveal
              className={cn(
                image.span === "wide" && "col-span-2",
              )}
            >
              <button
                ref={(node) => {
                  triggersRef.current[index] = node;
                }}
                type="button"
                onClick={() => setOpenIndex(index)}
                // The accessible name says what the picture is AND what the
                // button does — an icon-only "expand" would say neither.
                aria-label={`${image.alt} — ${lightbox.openLabel}`}
                className="group relative block w-full overflow-hidden rounded-[var(--r-media)] bg-[var(--linen)] shadow-[var(--shadow-sm)] transition-[transform,box-shadow] duration-500 ease-[var(--ease-out)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] focus-visible:-translate-y-1 motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0"
                style={{ aspectRatio: `${image.width} / ${image.height}` }}
              >
                <Image
                  src={image.src}
                  alt=""
                  width={image.width}
                  height={image.height}
                  // The first row is close enough to the fold to be worth
                  // fetching straight away; the rest waits.
                  loading={index < 2 ? "eager" : "lazy"}
                  sizes={
                    image.span === "wide"
                      ? "(max-width: 1023px) 100vw, 50vw"
                      : "(max-width: 1023px) 50vw, 25vw"
                  }
                  className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />

                {/* Warm scrim + expand affordance. Appears on hover AND focus,
                    never hover alone. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(34,26,21,0.5)_100%)] opacity-0 transition-opacity duration-400 group-hover:opacity-100 group-focus-visible:opacity-100"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-3 right-3 inline-flex h-9 w-9 translate-y-1 items-center justify-center rounded-[var(--r-pill)] bg-[rgba(251,246,236,0.94)] text-[var(--espresso)] opacity-0 transition-[opacity,transform] duration-400 ease-[var(--ease-out)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
                >
                  <Expand size={15} strokeWidth={2.1} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Lightbox
        images={images}
        index={openIndex}
        onClose={close}
        onNavigate={setOpenIndex}
      />
    </section>
  );
}
