import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  /** Small uppercase label above the heading. */
  eyebrow: string;
  heading: string;
  /** Optional lead paragraph under the heading. */
  intro?: string;
  /** Heading level — keeps the document outline correct per section. */
  as?: "h2" | "h3";
  /** DOM id used by `aria-labelledby` on the surrounding <section>. */
  id?: string;
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
};

/**
 * Shared editorial section opener: eyebrow, serif heading, optional lead.
 * Keeping it in one place is what makes the vertical rhythm identical across
 * all eight sections.
 */
export function SectionHeader({
  eyebrow,
  heading,
  intro,
  as: Heading = "h2",
  id,
  align = "left",
  className,
  children,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
      data-reveal
    >
      <span className="eyebrow">{eyebrow}</span>
      <Heading
        id={id}
        className="max-w-[24ch] text-[length:var(--fs-h2)]"
      >
        {heading}
      </Heading>
      {intro ? (
        <p className={cn("lead", align === "center" && "mx-auto text-center")}>
          {intro}
        </p>
      ) : null}
      {children}
    </div>
  );
}
