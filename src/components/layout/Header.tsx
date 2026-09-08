"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger, DUR, EASE, registerGsap, prefersReducedMotion } from "@/lib/motion";
import { useActiveSection } from "@/lib/useActiveSection";
import { useSmoothScroll } from "@/components/motion/SmoothScrollProvider";
import { MenuOverlay } from "@/components/layout/MenuOverlay";
import { Button } from "@/components/ui/Button";
import { header, a11y } from "@/content/de";

/**
 * A4 — smart header.
 *
 * Transparent at the top; past 80px it gains a blur, a hairline and a soft
 * drop shadow; scrolling down past 200px hides it and scrolling up brings it
 * back. Colours are inherited from the active theme, so it inverts with the
 * section beneath it. The wordmark carries a slowly travelling accent-gradient
 * ring that turns the other way under the pointer, and grows a little when the
 * pointer is on it. The link for the section currently under the fold line
 * lights up and takes a soft pill behind it.
 */
export function Header() {
  const bar = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const { scrollTo } = useSmoothScroll();
  const pathname = usePathname();
  const onHome = pathname === "/";
  const activeId = useActiveSection();

  useEffect(() => {
    registerGsap();
    const element = bar.current;
    if (!element) return;

    const reduced = prefersReducedMotion();
    let hidden = false;

    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const y = self.scroll();
        setCondensed(y > 80);

        if (reduced) return;
        // Never hide the header while the menu is open — it holds the close button.
        const shouldHide = self.direction === 1 && y > 200;
        if (shouldHide === hidden) return;
        hidden = shouldHide;
        gsap.to(element, {
          yPercent: shouldHide ? -100 : 0,
          duration: DUR.fast,
          ease: EASE.out,
        });
      },
    });

    return () => trigger.kill();
  }, []);

  // Reveal the header again whenever the menu opens.
  useEffect(() => {
    const element = bar.current;
    if (!element || !menuOpen) return;
    gsap.to(element, { yPercent: 0, duration: DUR.fast, ease: EASE.out });
  }, [menuOpen]);

  const handleAnchor = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!onHome || !href.startsWith("#")) return;
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    scrollTo(href);
  };

  // Only in-page anchors get rewritten off the home page; absolute URLs
  // such as the WhatsApp CTA must pass through as they are.
  const linkHref = (href: string) =>
    onHome || !href.startsWith("#") ? href : `/${href}`;

  return (
    <>
      <header
        ref={bar}
        className="fixed inset-x-0 top-0 z-[120] transition-[background-color,backdrop-filter,border-color] duration-300"
        style={{
          backgroundColor: condensed ? "color-mix(in srgb, var(--bg) 72%, transparent)" : "transparent",
          backdropFilter: condensed ? "blur(12px)" : "none",
          WebkitBackdropFilter: condensed ? "blur(12px)" : "none",
          borderBottom: `1px solid ${condensed ? "var(--hairline)" : "transparent"}`,
          boxShadow: condensed ? "0 8px 24px rgba(11, 11, 13, 0.18)" : "none",
          color: "var(--fg)",
        }}
      >
        <div className="wrap flex h-[var(--header-h)] items-center justify-between gap-6">
          <Link
            href="/"
            aria-label={header.homeLabel}
            className="gradient-ring-host relative t-h3 rounded-[var(--r-pill)] px-4 py-1 font-bold tracking-[-0.03em] transition-transform duration-300 hover:scale-110"
            data-cursor="link"
            onClick={(event) => {
              if (!onHome) return;
              event.preventDefault();
              scrollTo("body", 0);
            }}
          >
            <span className="gradient-ring gradient-ring-always" aria-hidden="true" />
            {header.wordmark}
          </Link>

          <nav aria-label={a11y.menuLabel} className="hidden items-center gap-8 lg:flex">
            {header.nav.map((item) => {
              const active = onHome && item.href === `#${activeId}`;
              return (
                <a
                  key={item.href}
                  href={linkHref(item.href)}
                  aria-current={active ? "true" : undefined}
                  className={clsx(
                    "t-mono link-underline rounded-[var(--r-pill)] px-3 py-1.5 transition-colors duration-300",
                    active ? "bg-[var(--hairline)]" : "t-muted hover:text-[var(--fg)]"
                  )}
                  data-cursor="link"
                  onClick={(event) => handleAnchor(event, item.href)}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <span className="t-mono hidden t-muted sm:inline">{header.localeLabel}</span>
            <span className="hidden lg:inline">
              <Button label={header.cta.label} href={linkHref(header.cta.href)} variant="outline" />
            </span>
            <button
              type="button"
              className="relative grid h-11 w-11 place-items-center"
              aria-expanded={menuOpen}
              aria-controls="amw-menu"
              aria-label={menuOpen ? a11y.menuClose : a11y.menuOpen}
              data-cursor="link"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="relative block h-4 w-6">
                <span
                  className="absolute left-0 block h-px w-6 transition-transform duration-300"
                  style={{
                    backgroundColor: "currentColor",
                    top: menuOpen ? "50%" : "2px",
                    transform: menuOpen ? "rotate(45deg)" : "none",
                  }}
                />
                <span
                  className="absolute left-0 block h-px w-6 transition-transform duration-300"
                  style={{
                    backgroundColor: "currentColor",
                    bottom: menuOpen ? "auto" : "2px",
                    top: menuOpen ? "50%" : "auto",
                    transform: menuOpen ? "rotate(-45deg)" : "none",
                  }}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} onHome={onHome} />
    </>
  );
}
