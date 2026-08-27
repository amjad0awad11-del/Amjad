"use client";

import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { RevealText } from "@/components/motion/RevealText";
import { rechtliches } from "@/content/de";
import { containsPlaceholder } from "@/lib/placeholder";

type Legal = typeof rechtliches.impressum | typeof rechtliches.datenschutz;

/**
 * Shared long-form layout for /impressum and /datenschutz.
 *
 * The substantive text is a [[PLACEHOLDER]] until the client supplies
 * legally binding wording — no legal text is drafted here.
 */
export function LegalPage({ content, titleId }: { content: Legal; titleId: string }) {
  const pending = containsPlaceholder(content.content);

  return (
    <Shell>
      <section data-theme="light" aria-labelledby={titleId} className="section-y">
        <div className="wrap grid gap-14 pt-[var(--header-h)] lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-4">
            <p className="t-mono t-muted">{content.label}</p>
            <RevealText as="h1" id={titleId} className="t-h2">
              {content.title}
            </RevealText>
            <Link href="/" className="t-mono link-underline" data-cursor="link">
              {content.back}
            </Link>
          </div>

          <div className="flex flex-col gap-8 lg:col-span-7 lg:col-start-6">
            <RevealText as="p" className="t-body t-muted">
              {content.intro}
            </RevealText>

            <div
              className="border-t pt-8"
              style={{ borderColor: "var(--hairline)" }}
              data-placeholder={pending ? "legal" : undefined}
            >
              <p className="t-h3 break-words" style={{ opacity: pending ? 0.7 : 1 }}>
                {content.content}
              </p>
              {pending && <p className="t-mono t-muted mt-4 max-w-[52ch]">{content.hint}</p>}
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
