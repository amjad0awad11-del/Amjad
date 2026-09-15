import Image from "next/image";
import { CakeSlice, Coffee, Salad, Sandwich } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { auswahl, type MenuIcon } from "@/content/cafe";

/** Content declares an icon key; the mapping to a real glyph lives here. */
const ICONS: Record<MenuIcon, LucideIcon> = {
  baguette: Sandwich,
  kuchen: CakeSlice,
  salat: Salad,
  kaffee: Coffee,
};

/**
 * "Was Sie bei uns erwartet." — the four confirmed offer categories.
 *
 * Deliberately no prices: none could be confirmed, and an invented price is the
 * fastest way to lose a guest's trust at the counter.
 */
export function Auswahl() {
  return (
    <section
      id="auswahl"
      aria-labelledby="auswahl-heading"
      className="section material-linen relative"
    >
      <div className="shell flex flex-col gap-12">
        <SectionHeader
          eyebrow={auswahl.eyebrow}
          heading={auswahl.heading}
          intro={auswahl.intro}
          id="auswahl-heading"
        />

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7">
          {auswahl.cards.map((card) => {
            const Icon = ICONS[card.icon];
            return (
              <li key={card.id} data-reveal className="h-full">
                {/*
                  A group, not a link: there is no menu detail page to go to and
                  nothing to buy online, so making the whole card clickable would
                  promise an interaction that does not exist. The hover and focus
                  states below are driven by `:focus-within` too, so keyboard
                  users get identical feedback.
                */}
                <article
                  tabIndex={0}
                  className="group flex h-full flex-col overflow-hidden rounded-[var(--r-card)] border border-[var(--hairline)] bg-[var(--ceramic)] shadow-[var(--shadow-sm)] transition-[transform,box-shadow,border-color] duration-400 ease-[var(--ease-out)] hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--caramel)_55%,transparent)] hover:shadow-[var(--shadow-lg)] focus-visible:-translate-y-1 focus-visible:shadow-[var(--shadow-lg)] motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[var(--linen)]">
                    <Image
                      src={card.image.src}
                      alt={card.image.alt}
                      width={card.image.width}
                      height={card.image.height}
                      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                      className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--r-pill)] bg-[color-mix(in_srgb,var(--caramel)_18%,transparent)] text-[var(--caramel-deep)] transition-colors duration-300 group-hover:bg-[color-mix(in_srgb,var(--caramel)_30%,transparent)]"
                    >
                      <Icon size={20} strokeWidth={1.9} />
                    </span>

                    <h3 className="text-[length:var(--fs-h3)] leading-[1.2]">
                      {card.title}
                    </h3>
                    <p className="text-[0.9375rem] leading-[1.65] text-[var(--muted)]">
                      {card.text}
                    </p>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>

        <p
          data-reveal
          className="text-[0.875rem] text-[var(--muted-on-linen)]"
        >
          {auswahl.priceNote}
        </p>
      </div>
    </section>
  );
}
