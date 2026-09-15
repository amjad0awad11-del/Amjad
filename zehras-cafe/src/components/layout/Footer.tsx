import { Facebook, Instagram, MapPin, Music2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Wordmark } from "@/components/layout/Wordmark";
import {
  business,
  footer,
  routeCta,
  socialLinks,
  type SocialLink,
} from "@/content/cafe";

const ICONS: Record<SocialLink["platform"], LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Music2,
};

export function Footer() {
  return (
    <footer className="border-t border-[var(--hairline)] bg-[var(--cream)]">
      <div className="shell flex flex-col gap-10 py-14">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-4">
            <Wordmark variant="stacked" />
            <p className="max-w-[30ch] font-display text-[1.0625rem] leading-[1.45] text-[var(--muted)]">
              {footer.tagline}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="font-sans text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Adresse
            </h2>
            <address className="not-italic leading-[1.7] text-[var(--espresso)]">
              {business.address.street}
              <br />
              {business.address.postalCode} {business.address.city}
              <br />
              {business.address.country}
            </address>
            <a
              href={routeCta.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={routeCta.ariaLabel}
              className="inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-semibold text-[var(--caramel-deep)] underline decoration-[var(--caramel)]/40 decoration-1 underline-offset-[5px] transition-colors hover:decoration-[var(--caramel)]"
            >
              <MapPin size={16} strokeWidth={2.1} aria-hidden="true" />
              {routeCta.label}
            </a>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="font-sans text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Folgen &amp; Rechtliches
            </h2>

            {socialLinks.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {socialLinks.map((link) => {
                  const Icon = ICONS[link.platform];
                  return (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 text-[0.9375rem] text-[var(--espresso)] transition-colors hover:text-[var(--caramel-deep)]"
                      >
                        <Icon size={16} strokeWidth={2} aria-hidden="true" />
                        {link.label}
                        <span className="sr-only"> (öffnet in einem neuen Tab)</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            <ul className="flex flex-col gap-1">
              {footer.legalLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inline-flex min-h-11 items-center text-[0.9375rem] text-[var(--espresso)] transition-colors hover:text-[var(--caramel-deep)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-[var(--hairline)] pt-6 text-[0.8125rem] text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            {/*
              The year is evaluated at render time. On a statically generated
              page that means the build year is in the HTML and the browser
              replaces it with the real one during hydration — hence
              suppressHydrationWarning, which is the idiomatic escape hatch for
              intentionally time-dependent output.
            */}
            © <span suppressHydrationWarning>{new Date().getFullYear()}</span>{" "}
            {footer.copyrightHolder}
          </p>
          {footer.credit ? <p>{footer.credit}</p> : null}
        </div>
      </div>
    </footer>
  );
}
