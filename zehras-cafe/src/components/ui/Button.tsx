import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "onDark" | "ghost";
type Size = "md" | "lg";

const base =
  // min-h-11 == 44px: the WCAG 2.2 target-size floor, applied to every variant
  // rather than only the mobile ones.
  "group relative inline-flex min-h-11 items-center justify-center gap-2 " +
  "rounded-[var(--r-pill)] px-6 text-center font-sans text-[0.9375rem] font-semibold " +
  "leading-none tracking-[0.005em] transition-[transform,background-color,border-color,color,box-shadow] " +
  "duration-300 ease-[var(--ease-out)] motion-reduce:transition-none " +
  // Lifting on hover AND focus, never hover alone, so keyboard users get the
  // same feedback.
  "hover:-translate-y-0.5 focus-visible:-translate-y-0.5 active:translate-y-0 " +
  "motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--espresso)] text-[var(--on-dark)] shadow-[var(--shadow-md)] " +
    "hover:bg-[var(--charcoal)] hover:shadow-[var(--shadow-lg)] focus-visible:bg-[var(--charcoal)]",
  secondary:
    "border border-[var(--hairline-strong)] bg-[var(--ceramic)]/70 text-[var(--espresso)] " +
    "backdrop-blur-[2px] hover:border-[var(--caramel)] hover:bg-[var(--ceramic)] " +
    "focus-visible:border-[var(--caramel)]",
  onDark:
    "bg-[var(--cream)] text-[var(--espresso)] shadow-[var(--shadow-md)] " +
    "hover:bg-white focus-visible:bg-white",
  ghost:
    "text-[var(--caramel-deep)] underline decoration-[var(--caramel)]/40 decoration-1 " +
    "underline-offset-[6px] hover:decoration-[var(--caramel)] focus-visible:decoration-[var(--caramel)]",
};

const sizes: Record<Size, string> = {
  md: "min-h-11 px-6",
  lg: "min-h-[3.25rem] px-8 text-base",
};

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  /** Rendered before the label; decorative, so pass aria-hidden icons. */
  icon?: ReactNode;
  /** Rendered after the label. */
  iconAfter?: ReactNode;
};

type LinkProps = CommonProps &
  Omit<ComponentProps<"a">, "className" | "children"> & {
    href: string;
  };

type ButtonProps = CommonProps &
  Omit<ComponentProps<"button">, "className" | "children"> & {
    href?: undefined;
  };

/**
 * One button surface for the whole site, rendered as `<a>` when it has an
 * `href` and as `<button>` otherwise.
 *
 * Anything pointing at another origin (Google Maps, Instagram) opens in a new
 * tab with `rel="noopener noreferrer"`, and the new-tab behaviour is announced
 * to screen readers instead of being a silent surprise.
 */
export function Button(props: LinkProps | ButtonProps) {
  const {
    children,
    variant = "primary",
    size = "md",
    className,
    icon,
    iconAfter,
    ...rest
  } = props;

  const classes = cn(base, variants[variant], sizes[size], className);

  if (typeof props.href === "string") {
    const { href, target, rel, ...anchorRest } =
      rest as Omit<LinkProps, keyof CommonProps>;
    const isExternal = /^https?:\/\//i.test(href);
    const resolvedTarget = target ?? (isExternal ? "_blank" : undefined);
    const opensNewTab = resolvedTarget === "_blank";

    return (
      <a
        {...anchorRest}
        href={href}
        target={resolvedTarget}
        rel={rel ?? (opensNewTab ? "noopener noreferrer" : undefined)}
        className={classes}
      >
        {icon}
        <span>{children}</span>
        {iconAfter}
        {opensNewTab ? (
          <span className="sr-only"> (öffnet in einem neuen Tab)</span>
        ) : null}
      </a>
    );
  }

  const { type, ...buttonRest } = rest as Omit<ButtonProps, keyof CommonProps>;

  return (
    <button {...buttonRest} type={type ?? "button"} className={classes}>
      {icon}
      <span>{children}</span>
      {iconAfter}
    </button>
  );
}
