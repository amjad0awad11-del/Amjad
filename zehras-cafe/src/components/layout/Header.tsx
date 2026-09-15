"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { MapPin, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/layout/Wordmark";
import { nav, routeCta } from "@/content/cafe";
import { cn } from "@/lib/cn";

/** Section ids the scroll spy watches, derived from the nav itself. */
const SECTION_IDS = nav
  .filter((item) => item.href.startsWith("#"))
  .map((item) => item.href.slice(1));

export function Header() {
  const [open, setOpen] = useState(false);
  const [lifted, setLifted] = useState(false);
  const [active, setActive] = useState<string>(SECTION_IDS[0] ?? "");

  const drawerId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  /* ---------------------------------------------------------------- */
  /* Header gains a hairline + stronger blur once the page has moved   */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---------------------------------------------------------------- */
  /* Scroll spy — marks the current section with aria-current          */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const sections = SECTION_IDS.map((id) =>
      document.getElementById(id),
    ).filter((element): element is HTMLElement => element !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // The entry closest to the top of the viewport wins, which keeps the
        // marker stable while a tall section scrolls past.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top) -
              Math.abs(b.boundingClientRect.top),
          );
        if (visible[0]) setActive(visible[0].target.id);
      },
      // Bias the band towards the upper half so the highlight changes as a
      // section's heading arrives, not when its footer leaves.
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  /* ---------------------------------------------------------------- */
  /* Drawer: Escape to close, scroll lock, focus management + trap     */
  /* ---------------------------------------------------------------- */
  const close = useCallback(() => {
    setOpen(false);
    // Send focus back where it came from, per WAI-ARIA dialog guidance.
    toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    // Move focus into the dialog once it is on screen.
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab") return;

      const focusables = drawerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      // Keep Tab inside the drawer while it is modal.
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  return (
    <header
      className={cn(
        "no-print fixed inset-x-0 top-0 z-100 transition-[background-color,box-shadow,border-color] duration-300",
        lifted
          ? "border-b border-[var(--hairline)] bg-[color-mix(in_srgb,var(--cream)_88%,transparent)] shadow-[var(--shadow-sm)] backdrop-blur-[10px]"
          : "border-b border-transparent bg-[color-mix(in_srgb,var(--cream)_55%,transparent)] backdrop-blur-[4px]",
      )}
      style={{ height: "var(--header-h)" }}
    >
      <div className="shell flex h-full items-center justify-between gap-4">
        <a
          href="#start"
          // min-h-11 (44px): the wordmark is a real link, so it gets the same
          // target-size floor as every other control.
          className="flex min-h-11 items-center rounded-lg py-1"
          aria-label="Zehra’s Baguette & Café — zur Startseite"
        >
          <Wordmark />
        </a>

        {/* Desktop navigation */}
        <nav aria-label="Hauptnavigation" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => {
              const id = item.href.replace("#", "");
              const isActive = active === id;
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "relative inline-flex min-h-11 items-center rounded-[var(--r-pill)] px-3.5 text-[0.9375rem] font-medium transition-colors duration-200",
                      isActive
                        ? "text-[var(--espresso)]"
                        : "text-[var(--muted)] hover:text-[var(--espresso)]",
                    )}
                  >
                    {item.label}
                    {/* Caramel underline marks the current section. It repeats
                        information already carried by aria-current, so colour is
                        never the only signal. */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-3.5 bottom-[11px] h-[1.5px] origin-left rounded-full bg-[var(--caramel)] transition-transform duration-300 ease-[var(--ease-out)]",
                        isActive ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {/*
            The show/hide sits on this wrapper, not on the Button.
            `<Button>` always carries `inline-flex`, and a competing `hidden`
            in the same class attribute does NOT win just because it is
            written later — plain utilities are resolved by their order in the
            generated stylesheet, where `inline-flex` comes last. Toggling a
            parent avoids the collision entirely.
          */}
          <div className="hidden sm:block">
            <Button
              href={routeCta.href}
              aria-label={routeCta.ariaLabel}
              icon={<MapPin size={16} strokeWidth={2.1} aria-hidden="true" />}
            >
              {routeCta.label}
            </Button>
          </div>

          {/* Mobile menu trigger */}
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Menü öffnen"
            aria-expanded={open}
            aria-controls={drawerId}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--r-pill)] border border-[var(--hairline-strong)] bg-[var(--ceramic)] text-[var(--espresso)] transition-colors duration-200 hover:border-[var(--caramel)] lg:hidden"
          >
            <Menu size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Mobile drawer                                                     */}
      {/* ---------------------------------------------------------------- */}
      <div
        className={cn(
          "fixed inset-0 z-100 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        // Hidden from assistive tech and from Tab order while closed, so the
        // links cannot be reached behind the page.
        aria-hidden={!open}
        {...(open ? {} : { inert: "" as unknown as boolean })}
      >
        <div
          onClick={close}
          className={cn(
            "absolute inset-0 bg-[rgba(34,26,21,0.48)] backdrop-blur-[2px] transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
        />

        <div
          ref={drawerRef}
          id={drawerId}
          // The element stays mounted so it can slide in and out, but it only
          // *identifies* as a modal dialog while it is actually open. A
          // permanently present aria-modal="true" dialog is reported by
          // assistive tech even when nothing is showing, and it makes the page
          // look like it contains two open dialogs once the gallery lightbox
          // mounts.
          role={open ? "dialog" : undefined}
          aria-modal={open ? true : undefined}
          aria-label={open ? "Navigationsmenü" : undefined}
          className={cn(
            "absolute inset-y-0 right-0 flex w-[min(21rem,88vw)] flex-col bg-[var(--cream)] shadow-[var(--shadow-lg)] transition-transform duration-300 ease-[var(--ease-out)] motion-reduce:transition-none",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-[var(--hairline)] px-5 py-4">
            <Wordmark decorative />
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Menü schließen"
              className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--r-pill)] border border-[var(--hairline-strong)] bg-[var(--ceramic)] text-[var(--espresso)] transition-colors duration-200 hover:border-[var(--caramel)]"
            >
              <X size={20} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Menü" className="flex-1 overflow-y-auto px-5 py-4">
            <ul className="flex flex-col">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={close}
                    aria-current={
                      active === item.href.replace("#", "") ? "true" : undefined
                    }
                    className="flex min-h-14 items-center border-b border-[var(--hairline)] font-display text-[1.375rem] text-[var(--espresso)] transition-colors duration-200 aria-[current]:text-[var(--caramel-deep)]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-[var(--hairline)] p-5">
            <Button
              href={routeCta.href}
              aria-label={routeCta.ariaLabel}
              size="lg"
              className="w-full"
              icon={<MapPin size={17} strokeWidth={2.1} aria-hidden="true" />}
            >
              {routeCta.label}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
