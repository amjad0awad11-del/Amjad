import { Facebook, Instagram, Music2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { social, socialLinks, type SocialLink } from "@/content/cafe";

const ICONS: Record<SocialLink["platform"], LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  // Lucide has no TikTok glyph; a music note is the closest neutral stand-in.
  tiktok: Music2,
};

/**
 * "Einblicke aus unserer Küche."
 *
 * Verified profile links only. Nothing is scraped and no external feed is
 * embedded — an Instagram embed needs the café's own approval and a supported
 * integration, and it would also drag third-party tracking onto the page.
 *
 * With no confirmed profiles the section still renders, because the heading and
 * copy are asked for by the brief, but it says so plainly and points at the
 * Google listing rather than linking to a guessed handle.
 */
export function SocialMedia() {
  const hasLinks = socialLinks.length > 0;

  return (
    <section
      id="social"
      aria-labelledby="social-heading"
      className="section material-linen relative"
    >
      <div className="shell flex flex-col items-center gap-8 text-center">
        <SectionHeader
          eyebrow={social.eyebrow}
          heading={social.heading}
          id="social-heading"
          align="center"
        />

        <p
          data-reveal
          className="max-w-[54ch] text-[length:var(--fs-lead)] leading-[1.6] text-[var(--muted-on-linen)]"
        >
          {social.text}
        </p>

        {hasLinks ? (
          <ul data-reveal className="flex flex-wrap justify-center gap-3">
            {socialLinks.map((link) => {
              const Icon = ICONS[link.platform];
              return (
                <li key={link.href}>
                  <Button
                    href={link.href}
                    variant="secondary"
                    size="lg"
                    icon={<Icon size={18} strokeWidth={2} aria-hidden="true" />}
                  >
                    {link.label}
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div data-reveal className="flex flex-col items-center gap-4">
            <p className="max-w-[52ch] text-[0.9375rem] leading-[1.65] text-[var(--muted-on-linen)]">
              {social.fallbackText}
            </p>
            <Button href={social.fallbackCta.href} variant="secondary">
              {social.fallbackCta.label}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
