"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger, DUR, EASE, registerGsap, prefersReducedMotion } from "@/lib/motion";
import { useSmoothScroll } from "@/components/motion/SmoothScrollProvider";
import { MenuOverlay } from "@/components/layout/MenuOverlay";
import { Button } from "@/components/ui/Button";
import { header, a11y } from "@/content/de";

/**
 * A4 — smart header.
 *
 * Transparent at the top; past 80px it gains a blur and a hairline; scrolling
 * down past 200px hides it and scrolling up brings it back. Colours are
 * inherited from the active theme, so it inverts with the section beneath it.
 */
export function Header() {
  const bar = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const { scrollTo } = useSmoothScroll();
  const pathname = usePathname();
  const onHome = pathname === "/";

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

  const linkHref = (href: string) => (onHome ? href : `/${href}`);

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
          color: "var(--fg)",
        }}
      >
        <div className="wrap flex h-[var(--header-h)] items-center justify-between gap-6">
          <Link
            href="/"
            aria-label={header.homeLabel}
            className="t-h3 font-bold tracking-[-0.03em]"
            data-cursor="link"
            onClick={(event) => {
              if (!onHome) return;
              event.preventDefault();
              scrollTo("body", 0);
            }}
          >
            {header.wordmark}
          </Link>

          <nav aria-label={a11y.menuLabel} className="hidden items-center gap-8 lg:flex">
            {header.nav.map((item) => (
              <a
                key={item.href}
                href={linkHref(item.href)}
                className="t-mono link-underline"
                data-cursor="link"
                onClick={(event) => handleAnchor(event, item.href)}
              >
                {item.label}
              </a>
            ))}
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
