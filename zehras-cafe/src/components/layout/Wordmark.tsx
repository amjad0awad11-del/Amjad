import { cn } from "@/lib/cn";
import { business } from "@/content/cafe";

type Props = {
  /** `header` is one line; `stacked` is the two-line lockup for the footer. */
  variant?: "header" | "stacked";
  className?: string;
  /**
   * The wordmark appears once per landmark. Only the first one should carry the
   * accessible name, so decorative repeats pass `decorative`.
   */
  decorative?: boolean;
};

/**
 * Refined typographic wordmark for "Zehra's Baguette & Café".
 *
 * REPLACING THIS WITH AN OFFICIAL LOGO
 * ------------------------------------
 * Swap the inner markup for a `next/image` (or an inline SVG) and keep the
 * outer element plus the `aria-label`/`sr-only` name. Nothing else in the site
 * references the individual type layers, so the change is local to this file:
 *
 *   <span className={cn("inline-flex", className)}>
 *     <Image src="/images/logo.svg" alt={business.name} width={190} height={40} priority />
 *   </span>
 */
export function Wordmark({
  variant = "header",
  className,
  decorative = false,
}: Props) {
  const stacked = variant === "stacked";

  return (
    <span
      className={cn(
        "inline-flex select-none",
        stacked ? "flex-col gap-1" : "flex-col leading-none",
        className,
      )}
      aria-hidden={decorative || undefined}
    >
      {/* The visible mark is split into type layers for the lockup, so the
          accessible name is provided once, cleanly, as real text. */}
      <span className="sr-only">{business.name}</span>

      <span
        aria-hidden="true"
        className={cn(
          "font-display font-medium whitespace-nowrap tracking-[-0.02em] text-[var(--espresso)]",
          stacked ? "text-[1.6rem]" : "text-[1.25rem] sm:text-[1.4rem]",
        )}
      >
        Zehra’s
      </span>
      <span
        aria-hidden="true"
        className={cn(
          // whitespace-nowrap: at 375px the lockup would otherwise break into
          // "BAGUETTE &" / "CAFÉ" and push the header past its 68px height.
          "font-sans font-semibold whitespace-nowrap uppercase text-[var(--caramel-deep)]",
          stacked
            ? "text-[0.6875rem] tracking-[0.24em]"
            : "text-[0.5625rem] tracking-[0.2em] sm:text-[0.625rem]",
        )}
      >
        Baguette &amp; Café
      </span>
    </span>
  );
}
