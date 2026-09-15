import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { gaestestimmen } from "@/content/cafe";

/**
 * "Das sagen unsere Gäste."
 *
 * Renders ONLY when there is real, verified review material in the content file.
 * With `excerpts` empty the component returns `null` and the section disappears
 * without a trace — no empty heading, no skeleton, and above all no invented
 * testimonial. The rating badge additionally requires BOTH a rating and a
 * review count, because one without the other is not a claim we can stand
 * behind.
 *
 * Review author names, avatars and profile pictures are never rendered: they
 * are personal data belonging to Google users, not café assets.
 */
export function Gaestestimmen() {
  const { rating, reviewCount, excerpts, cta } = gaestestimmen;

  if (excerpts.length === 0) return null;

  const showRating = typeof rating === "number" && typeof reviewCount === "number";

  return (
    <section
      id="gaestestimmen"
      aria-labelledby="gaestestimmen-heading"
      className="section material-linen relative"
    >
      <div className="shell flex flex-col gap-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader
            eyebrow={gaestestimmen.eyebrow}
            heading={gaestestimmen.heading}
            id="gaestestimmen-heading"
          />

          {showRating ? (
            <div
              data-reveal
              className="flex shrink-0 items-center gap-3 rounded-[var(--r-card)] border border-[var(--hairline)] bg-[var(--ceramic)] px-5 py-4 shadow-[var(--shadow-sm)]"
            >
              <span
                aria-hidden="true"
                className="flex items-center gap-0.5 text-[var(--caramel)]"
              >
                {Array.from({ length: 5 }, (_, starIndex) => (
                  <Star
                    key={starIndex}
                    size={15}
                    strokeWidth={1.5}
                    // Partial stars are not drawn: the numeric value next to
                    // them is the precise figure.
                    fill={starIndex < Math.round(rating) ? "currentColor" : "none"}
                  />
                ))}
              </span>
              <span className="text-[0.9375rem] font-semibold text-[var(--espresso)]">
                {rating.toLocaleString("de-DE", { minimumFractionDigits: 1 })}
              </span>
              <span className="text-[0.8125rem] text-[var(--muted)]">
                ({reviewCount.toLocaleString("de-DE")})
              </span>
              {/* The visual badge is decorative shorthand; this is the sentence
                  a screen reader actually hears. */}
              <span className="sr-only">
                {gaestestimmen.ratingLabel(rating, reviewCount)}
              </span>
            </div>
          ) : null}
        </div>

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {excerpts.map((excerpt) => (
            <li key={excerpt.quote.slice(0, 40)} data-reveal className="h-full">
              <figure className="flex h-full flex-col gap-5 rounded-[var(--r-card)] border border-[var(--hairline)] bg-[var(--ceramic)] p-6 shadow-[var(--shadow-sm)]">
                <blockquote className="flex-1">
                  <p className="font-display text-[1.125rem] leading-[1.5] text-[var(--espresso)]">
                    {/* Typographic German quotation marks. */}
                    „{excerpt.quote}“
                  </p>
                </blockquote>
                <figcaption className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  {excerpt.source}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>

        <div data-reveal>
          <Button href={cta.href} variant="secondary" size="lg">
            {cta.label}
          </Button>
        </div>
      </div>
    </section>
  );
}
