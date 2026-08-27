"use client";

import { useRef } from "react";
import { gsap, EASE, prefersReducedMotion } from "@/lib/motion";
import { useGsap } from "@/lib/useGsap";
import { RevealText } from "@/components/motion/RevealText";
import { Counter } from "@/components/motion/Counter";
import { manifest } from "@/content/de";

/**
 * A leading numeral animates; the rest of the value ("–4", " €") stays put, so
 * ranges like "2–4" and "0 €" count only their first number.
 */
function Fact({ value, label }: { value: string; label: string }) {
  const match = value.match(/^(\d+)(.*)$/);

  return (
    <div
      className="flex flex-col-reverse gap-2 border-t pt-5"
      style={{ borderColor: "var(--hairline)" }}
    >
      <dt className="t-mono t-muted">{label}</dt>
      <dd className="t-h2 m-0" style={{ color: "var(--accent)" }}>
        {match ? (
          <>
            <Counter value={Number(match[1])} format={false} />
            {match[2]}
          </>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

/**
 * S4 — Manifest.
 *
 * The two manifesto paragraphs use the scrubbed word-level reveal (A10 variant):
 * words brighten from 0.15 to full as the block crosses the viewport. Every
 * word is in the DOM at full opacity before GSAP touches it.
 */
export function Manifest() {
  const scope = useRef<HTMLElement>(null);

  useGsap(
    () => {
      if (prefersReducedMotion()) return;

      const restore: Array<() => void> = [];

      gsap.utils.toArray<HTMLElement>("[data-word-scrub]").forEach((block) => {
        const text = block.textContent ?? "";
        restore.push(() => {
          block.textContent = text;
        });
        block.textContent = "";
        const words = text.split(/(\s+)/).map((chunk) => {
          if (!chunk.trim()) {
            block.appendChild(document.createTextNode(chunk));
            return null;
          }
          const span = document.createElement("span");
          span.textContent = chunk;
          span.style.display = "inline-block";
          block.appendChild(span);
          return span;
        });

        const spans = words.filter(Boolean) as HTMLElement[];
        gsap.fromTo(
          spans,
          { opacity: 0.15 },
          {
            opacity: 1,
            ease: EASE.linear,
            stagger: 0.4,
            scrollTrigger: {
              trigger: block,
              start: "top 78%",
              end: "+=40%",
              scrub: true,
            },
          }
        );
      });

      return () => restore.forEach((reset) => reset());
    },
    scope,
    []
  );

  return (
    <section
      ref={scope}
      id={manifest.id}
      data-theme="dark"
      aria-labelledby="manifest-title"
      className="section-y relative overflow-hidden"
    >
      <div className="wrap grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <p className="t-mono t-muted">{manifest.label}</p>
        </div>

        <div className="flex flex-col gap-12 lg:col-span-9">
          <RevealText as="h2" id="manifest-title" className="t-h2 max-w-[20ch]">
            {manifest.lead}
          </RevealText>

          <p data-word-scrub className="t-body max-w-[62ch]">
            {manifest.body}
          </p>

          <div
            className="grid gap-10 border-t pt-12 lg:grid-cols-2"
            style={{ borderColor: "var(--hairline)" }}
            data-parallax="0.05"
          >
            <RevealText as="p" className="t-h3 max-w-[16ch]">
              {manifest.claim}
            </RevealText>
            <p data-word-scrub className="t-body t-muted">
              {manifest.claimBody}
            </p>
          </div>

          <dl className="grid gap-8 sm:grid-cols-3">
            {manifest.facts.map((fact) => (
              <Fact key={fact.label} value={fact.value} label={fact.label} />
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
