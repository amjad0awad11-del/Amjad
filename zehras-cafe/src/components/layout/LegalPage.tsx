import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Wordmark } from "@/components/layout/Wordmark";

type Block = {
  readonly heading: string;
  readonly lines: readonly string[];
};

type Props = {
  title: string;
  intro: string;
  blocks: readonly Block[];
  note: string;
};

/**
 * Shared shell for Impressum and Datenschutz.
 *
 * Deliberately plain: no hero, no animation, no video — these are documents a
 * guest (or a regulator) needs to be able to read and print. The `[[…]]`
 * markers from the content file are rendered as-is and highlighted, so an
 * unfinished legal page is impossible to miss before launch.
 */
export function LegalPage({ title, intro, blocks, note }: Props) {
  return (
    <>
      <header className="border-b border-[var(--hairline)]">
        <div className="shell flex items-center justify-between gap-4 py-5">
          <Link href="/" className="flex items-center" aria-label="Zur Startseite">
            <Wordmark />
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium text-[var(--muted)] transition-colors hover:text-[var(--espresso)]"
          >
            <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
            Zurück zur Startseite
          </Link>
        </div>
      </header>

      <main id="inhalt" className="shell py-16">
        <article className="max-w-[68ch]">
          <h1 className="mb-5 text-[length:var(--fs-h2)]">{title}</h1>
          <p className="lead mb-10">{intro}</p>

          <div className="flex flex-col gap-9">
            {blocks.map((block) => (
              <section key={block.heading}>
                <h2 className="mb-2.5 font-sans text-[0.8125rem] font-semibold uppercase tracking-[0.13em] text-[var(--caramel-deep)]">
                  {block.heading}
                </h2>
                <div className="flex flex-col gap-2.5">
                  {block.lines.map((line) => (
                    <p
                      key={line.slice(0, 40)}
                      className="leading-[1.7] text-[var(--muted)]"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-12 rounded-[var(--r-card)] border border-[color-mix(in_srgb,var(--caramel)_45%,transparent)] bg-[color-mix(in_srgb,var(--caramel)_10%,transparent)] p-5 text-[0.875rem] leading-[1.65] text-[var(--espresso)]">
            <strong className="font-semibold">Hinweis: </strong>
            {note}
          </p>
        </article>
      </main>

      <Footer />
    </>
  );
}
