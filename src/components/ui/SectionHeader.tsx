import clsx from "clsx";
import { RevealText } from "@/components/motion/RevealText";

/**
 * The shared editorial section head: a mono eyebrow over a masked headline.
 * `titleId` wires the heading to its section's aria-labelledby.
 */
export function SectionHeader({
  label,
  title,
  titleId,
  className,
  align = "start",
}: {
  label: string;
  title: string;
  titleId: string;
  className?: string;
  align?: "start" | "center";
}) {
  return (
    <div className={clsx("flex flex-col gap-6", align === "center" && "items-center text-center", className)}>
      <RevealText as="p" className="t-mono t-muted" variant="section">
        {label}
      </RevealText>
      <RevealText as="h2" id={titleId} className="t-h2 max-w-[18ch]" variant="section" delay={0.06}>
        {title}
      </RevealText>
    </div>
  );
}
