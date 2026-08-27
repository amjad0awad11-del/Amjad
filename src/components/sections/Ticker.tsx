import { Marquee } from "@/components/motion/Marquee";
import { ticker } from "@/content/de";

/** S3 — the amber keyword band (A9). */
export function Ticker() {
  const label = ticker.items.join(` ${ticker.separator} `);

  return (
    <section
      data-theme="amber"
      aria-label={label}
      className="flex min-h-[120px] items-center overflow-hidden py-6"
    >
      <Marquee ariaLabel={label}>
        {ticker.items.map((item) => (
          <span key={item} className="flex items-center">
            <span className="t-h2 whitespace-nowrap px-6 uppercase">{item}</span>
            <span className="t-h2 opacity-60" aria-hidden="true">
              {ticker.separator}
            </span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}
