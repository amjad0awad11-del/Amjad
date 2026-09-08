"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap, EASE, STAGGER, prefersReducedMotion } from "@/lib/motion";
import { useGsap } from "@/lib/useGsap";
import { useSmoothScroll } from "@/components/motion/SmoothScrollProvider";
import { Marquee } from "@/components/motion/Marquee";
import { SmartLink } from "@/components/ui/SmartLink";
import { footer } from "@/content/de";

/** Live Berlin wall clock. Renders empty on the server so SSR and client agree. */
function BerlinClock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const format = new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const tick = () => setTime(format.format(new Date()));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <p className="t-mono t-muted">
      {footer.clockLabel}
      {time ? ` · ${time}` : ""}
    </p>
  );
}

/**
 * A25 — footer finale: a claim marquee runs across the top, the wordmark rises
 * letter by letter out of its mask, and a live clock, an availability dot and a
 * smooth scroll back to the top sit in between.
 */
export function Footer({ onHome }: { onHome: boolean }) {
  const scope = useRef<HTMLElement>(null);
  const { scrollTo } = useSmoothScroll();

  useGsap(
    () => {
      const letters = gsap.utils.toArray<HTMLElement>("[data-footer-letter]");
      if (letters.length === 0 || prefersReducedMotion()) return;

      gsap.set(letters, { yPercent: 100 });
      gsap.to(letters, {
        yPercent: 0,
        duration: 1.1,
        ease: EASE.expo,
        stagger: STAGGER.chars * 4,
        scrollTrigger: { trigger: scope.current, start: "top 90%", once: true },
      });
    },
    scope,
    []
  );

  // Only in-page anchors get rewritten off the home page; absolute URLs
  // such as the WhatsApp CTA must pass through as they are.
  const linkHref = (href: string) =>
    onHome || !href.startsWith("#") ? href : `/${href}`;

  const handleAnchor = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!onHome) return;
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    scrollTo(href);
  };

  return (
    <footer ref={scope} data-theme="dark" className="relative overflow-hidden">
      {/* The claim, on a loop. Duplicated so the seam at -100% is invisible;
          scroll velocity drives its speed and skew like the amber ticker's. */}
      <div
        className="border-y py-5"
        style={{ borderColor: "var(--hairline)" }}
        aria-hidden="true"
      >
        <Marquee duration={40}>
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className="flex items-center">
              <span className="t-h2 whitespace-nowrap px-6 uppercase t-muted">
                {footer.marquee.text}
              </span>
              <span className="t-h2 t-muted opacity-50">{footer.marquee.separator}</span>
            </span>
          ))}
        </Marquee>
      </div>

      <div className="wrap pt-[clamp(64px,9vh,140px)]">
        <div className="grid gap-12 border-b pb-14 md:grid-cols-3" style={{ borderColor: "var(--hairline)" }}>
          <div className="flex flex-col gap-3">
            <p className="t-h3">{footer.tagline}</p>
            <BerlinClock />
          </div>

          <nav aria-label={footer.navTitle} className="flex flex-col gap-3">
            <p className="t-mono t-muted">{footer.navTitle}</p>
            <ul className="flex flex-col gap-2">
              {footer.nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={linkHref(item.href)}
                    className="link-underline"
                    data-cursor="link"
                    onClick={(event) => handleAnchor(event, item.href)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <p className="t-mono t-muted">{footer.socialTitle}</p>
              <ul className="flex flex-col gap-2">
                {footer.social.map((item) => (
                  <li key={item.label}>
                    <SmartLink href={item.href} className="link-underline" data-cursor="link">
                      {item.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <p className="t-mono t-muted">{footer.legalTitle}</p>
              <ul className="flex flex-col gap-2">
                {footer.legal.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="link-underline" data-cursor="link">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 py-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <p className="t-mono t-muted">{footer.copyright}</p>
            <p className="t-mono flex items-center gap-2.5">
              <span className="status-dot" aria-hidden="true" />
              {footer.availability}
            </p>
          </div>
          <button
            type="button"
            className="t-mono link-underline min-h-[44px]"
            data-cursor="link"
            onClick={() => scrollTo("body", 0)}
          >
            {footer.backToTop}
          </button>
        </div>
      </div>

      <div className="wrap pb-6" aria-hidden="true">
        <span className="flex justify-between">
          {footer.wordmark.split("").map((letter, index) => (
            <span key={`${letter}-${index}`} className="overflow-hidden">
              <span
                data-footer-letter
                className="block font-bold uppercase leading-[0.78]"
                style={{ fontSize: "clamp(4rem, 27vw, 22rem)", letterSpacing: "-0.05em" }}
              >
                {letter}
              </span>
            </span>
          ))}
        </span>
      </div>
    </footer>
  );
}
