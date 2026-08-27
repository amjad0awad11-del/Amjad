"use client";

import { useEffect, useRef } from "react";
import { SmartLink } from "@/components/ui/SmartLink";
import { gsap, DUR, EASE, STAGGER, prefersReducedMotion } from "@/lib/motion";
import { useSmoothScroll } from "@/components/motion/SmoothScrollProvider";
import { menu, a11y } from "@/content/de";

const LOCK = "menu";
const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * A5 — full-screen menu.
 *
 * The panel wipes down with clip-path, links rise out of their masks, then the
 * meta column fades in. Escape closes it, focus is trapped while it is open,
 * scroll is locked, and the trigger regains focus on close.
 */
export function MenuOverlay({
  open,
  onClose,
  onHome,
}: {
  open: boolean;
  onClose: () => void;
  onHome: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const { lock, unlock, scrollTo } = useSmoothScroll();

  // Build the timeline once, then play/reverse it.
  useEffect(() => {
    const element = panel.current;
    if (!element) return;

    const context = gsap.context(() => {
      const links = gsap.utils.toArray<HTMLElement>("[data-menu-link-inner]");
      const meta = element.querySelector<HTMLElement>("[data-menu-meta]");
      const reduced = prefersReducedMotion();

      gsap.set(element, { clipPath: "inset(0 0 100% 0)", autoAlpha: 0 });
      gsap.set(links, { yPercent: 100 });
      gsap.set(meta, { autoAlpha: 0 });

      const tl = gsap.timeline({ paused: true });
      tl.set(element, { autoAlpha: 1 })
        .to(element, {
          clipPath: "inset(0 0 0% 0)",
          duration: reduced ? 0.01 : DUR.curtain,
          ease: EASE.curtain,
        })
        .to(
          links,
          {
            yPercent: 0,
            duration: reduced ? 0.01 : DUR.base,
            ease: EASE.expo,
            stagger: reduced ? 0 : STAGGER.lines,
          },
          reduced ? 0 : 0.25
        )
        .to(meta, { autoAlpha: 1, duration: reduced ? 0.01 : DUR.fast, ease: EASE.out }, "-=0.3");

      timeline.current = tl;
    }, element);

    return () => {
      context.revert();
      timeline.current = null;
    };
  }, []);

  useEffect(() => {
    const tl = timeline.current;
    const element = panel.current;
    if (!tl || !element) return;

    if (open) {
      opener.current = document.activeElement as HTMLElement | null;
      lock(LOCK);
      tl.play();
      // Move focus in once the panel is actually on screen.
      const focusTimer = window.setTimeout(() => {
        element.querySelector<HTMLElement>(FOCUSABLE)?.focus();
      }, 120);
      return () => window.clearTimeout(focusTimer);
    }

    unlock(LOCK);
    tl.reverse();
    opener.current?.focus?.();
  }, [open, lock, unlock]);

  // Escape to close, Tab wraps inside the panel.
  useEffect(() => {
    if (!open) return;
    const element = panel.current;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !element) return;

      const focusable = Array.from(element.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const go = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    onClose();
    if (!onHome) return;
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    // Let the close animation start before the scroll takes over.
    window.setTimeout(() => scrollTo(href), 260);
  };

  return (
    <div
      ref={panel}
      id="amw-menu"
      data-theme="dark"
      className="fixed inset-0 z-[130] flex flex-col justify-between overflow-y-auto invisible"
      style={{ backgroundColor: "var(--ink)", color: "var(--cream)" }}
      aria-hidden={!open}
      inert={!open}
    >
      <div className="wrap flex flex-1 flex-col justify-center pt-[calc(var(--header-h)+40px)] pb-16">
        <nav aria-label={a11y.menuLabel}>
          <ul className="flex flex-col gap-2">
            {menu.links.map((item) => (
              <li key={item.href} className="overflow-hidden">
                <a
                  href={onHome || !item.href.startsWith("#") ? item.href : `/${item.href}`}
                  data-cursor="link"
                  onClick={(event) => go(event, item.href)}
                  className="block"
                >
                  <span data-menu-link-inner className="block t-h2 uppercase">
                    {item.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div data-menu-meta className="wrap border-t pb-[var(--page-x)] pt-8" style={{ borderColor: "var(--line)" }}>
        <p className="t-mono t-muted mb-4">{menu.metaTitle}</p>
        <ul className="flex flex-wrap gap-x-10 gap-y-3">
          {menu.meta.map((item) => (
            <li key={item.label}>
              <SmartLink
                href={item.href}
                className="t-mono link-underline"
                data-cursor="link"
                onClick={onClose}
              >
                {item.label}
              </SmartLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
