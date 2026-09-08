"use client";

import { useEffect, useRef } from "react";
import { gsap, DUR, EASE, prefersReducedMotion } from "@/lib/motion";
import { useSmoothScroll } from "@/components/motion/SmoothScrollProvider";
import { a11y } from "@/content/de";

const LOCK = "lightbox";
const FOCUSABLE = 'button, a[href], [tabindex]:not([tabindex="-1"])';

export type LightboxItem = { src: string; alt: string };

/**
 * Click-to-enlarge for the gallery.
 *
 * Same manners as the showreel lightbox (A32): ink backdrop, clip-path open,
 * Escape and backdrop click to close, scroll locked while open, focus trapped
 * and handed back to whatever opened it.
 */
export function MediaLightbox({
  item,
  onClose,
}: {
  item: LightboxItem | null;
  onClose: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const { lock, unlock } = useSmoothScroll();
  const open = item !== null;

  useEffect(() => {
    const element = root.current;
    if (!element) return;

    if (!open) {
      unlock(LOCK);
      gsap.to(element, {
        autoAlpha: 0,
        duration: 0.3,
        ease: EASE.out,
        onComplete: () => gsap.set(element, { display: "none" }),
      });
      opener.current?.focus?.();
      return;
    }

    opener.current = document.activeElement as HTMLElement | null;
    lock(LOCK);

    const frame = element.querySelector<HTMLElement>("[data-lightbox-frame]");
    const reduced = prefersReducedMotion();

    gsap.set(element, { display: "grid" });
    const timeline = gsap.timeline();
    timeline.fromTo(
      element,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: reduced ? 0.01 : 0.3, ease: EASE.out }
    );
    if (frame && !reduced) {
      timeline.fromTo(
        frame,
        { scale: 0.94, clipPath: "inset(6% 0%)" },
        { scale: 1, clipPath: "inset(0% 0%)", duration: DUR.slow, ease: EASE.expo },
        0
      );
    }

    const focusTimer = window.setTimeout(() => {
      element.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    }, 120);

    return () => window.clearTimeout(focusTimer);
  }, [open, lock, unlock]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const element = root.current;
      if (!element) return;
      const focusable = Array.from(element.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={a11y.galleryLabel}
      aria-hidden={!open}
      inert={!open}
      className="fixed inset-0 z-[170] hidden place-items-center p-[var(--page-x)]"
      style={{
        backgroundColor: "color-mix(in srgb, var(--ink) 92%, transparent)",
        visibility: "hidden",
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div data-lightbox-frame className="relative w-full max-w-[1100px]">
        <div className="media-frame relative w-full">
          {item && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.src}
              alt={item.alt}
              width={1600}
              height={1200}
              className="h-auto max-h-[78vh] w-full object-contain"
            />
          )}
        </div>
        <div className="mt-4 flex items-start justify-between gap-6">
          <p className="t-mono" style={{ color: "var(--cream)" }}>
            {item?.alt}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="t-mono link-underline min-h-[44px] shrink-0"
            style={{ color: "var(--amber)" }}
            data-cursor="link"
          >
            {a11y.closeGallery}
          </button>
        </div>
      </div>
    </div>
  );
}
