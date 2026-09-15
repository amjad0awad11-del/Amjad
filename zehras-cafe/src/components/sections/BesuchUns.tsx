import { Clock, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LocationCard } from "@/components/sections/LocationCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  besuch,
  business,
  openingHours,
  openingHoursFallback,
} from "@/content/cafe";

/** "08:00" -> "08:00" (already display-ready); kept as a seam for reformatting. */
const formatTime = (time: string) => time.replace(":", ":");

/**
 * "Besuchen Sie uns in Moers." — the conversion section.
 *
 * Address is confirmed and always shown. Opening hours and the telephone number
 * are shown ONLY when they exist in the content file; until then the guest gets
 * an honest pointer to the Google listing instead of a plausible-looking guess.
 */
export function BesuchUns() {
  const hasHours = openingHours.length > 0;
  const phone = business.phone;

  return (
    <section
      id="besuch"
      aria-labelledby="besuch-heading"
      className="section relative"
    >
      <div className="shell flex flex-col gap-12">
        <SectionHeader
          eyebrow={besuch.eyebrow}
          heading={besuch.heading}
          intro={besuch.intro}
          id="besuch-heading"
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
          <div className="flex flex-col gap-8">
            {/* Address — confirmed data, marked up as a real postal address. */}
            <div data-reveal className="flex gap-4">
              <span
                aria-hidden="true"
                className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-pill)] bg-[color-mix(in_srgb,var(--caramel)_18%,transparent)] text-[var(--caramel-deep)]"
              >
                <MapPin size={18} strokeWidth={2} />
              </span>
              <div>
                <h3 className="mb-1.5 font-sans text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  {besuch.addressLabel}
                </h3>
                <address className="not-italic text-[length:var(--fs-body)] leading-[1.6] text-[var(--espresso)]">
                  <span className="block font-display text-[1.25rem] leading-[1.3]">
                    {business.name}
                  </span>
                  {business.address.street}
                  <br />
                  {business.address.postalCode} {business.address.city}
                </address>
              </div>
            </div>

            {/* Opening hours — real table, or an honest fallback. */}
            <div data-reveal className="flex gap-4">
              <span
                aria-hidden="true"
                className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-pill)] bg-[color-mix(in_srgb,var(--sage)_30%,transparent)] text-[var(--sage-deep)]"
              >
                <Clock size={18} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="mb-1.5 font-sans text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  {openingHoursFallback.title}
                </h3>

                {hasHours ? (
                  <dl className="flex max-w-[22rem] flex-col">
                    {openingHours.map((entry) => (
                      <div
                        key={entry.day}
                        className="flex items-baseline justify-between gap-4 border-b border-[var(--hairline)] py-2 last:border-b-0"
                      >
                        <dt className="text-[0.9375rem] text-[var(--espresso)]">
                          {entry.day}
                        </dt>
                        <dd className="text-[0.9375rem] font-medium tabular-nums text-[var(--muted)]">
                          {entry.opens && entry.closes
                            ? `${formatTime(entry.opens)} – ${formatTime(entry.closes)}`
                            : "Geschlossen"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <div className="flex flex-col items-start gap-2">
                    <p className="max-w-[40ch] text-[0.9375rem] leading-[1.65] text-[var(--muted)]">
                      {openingHoursFallback.text}
                    </p>
                    <Button href={besuch.mapCta.href} variant="ghost">
                      {openingHoursFallback.linkLabel}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Telephone — only when a real number has been confirmed. */}
            {phone ? (
              <div data-reveal className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-pill)] bg-[color-mix(in_srgb,var(--caramel)_18%,transparent)] text-[var(--caramel-deep)]"
                >
                  <Phone size={18} strokeWidth={2} />
                </span>
                <div>
                  <h3 className="mb-1.5 font-sans text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {besuch.phoneLabel}
                  </h3>
                  <a
                    href={`tel:${phone.dial}`}
                    className="inline-flex min-h-11 items-center text-[length:var(--fs-body)] font-medium text-[var(--espresso)] underline decoration-[var(--caramel)]/40 decoration-1 underline-offset-[5px] transition-colors hover:decoration-[var(--caramel)]"
                  >
                    {phone.display}
                  </a>
                </div>
              </div>
            ) : null}

            <div
              data-reveal
              className="flex flex-col items-start gap-3 sm:flex-row sm:items-center"
            >
              <Button
                href={besuch.mapCta.href}
                size="lg"
                icon={<MapPin size={17} strokeWidth={2.1} aria-hidden="true" />}
              >
                {besuch.mapCta.label}
              </Button>
              <Button
                href={besuch.reviewsCta.href}
                variant="secondary"
                size="lg"
              >
                {besuch.reviewsCta.label}
              </Button>
            </div>
          </div>

          <div data-reveal className="min-h-[300px]">
            <LocationCard />
          </div>
        </div>
      </div>
    </section>
  );
}
