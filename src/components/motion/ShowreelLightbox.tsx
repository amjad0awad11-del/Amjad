"use client";

import { useEffect, useRef } from "react";
import { gsap, DUR, EASE, prefersReducedMotion } from "@/lib/motion";
import { useSmoothScroll } from "@/components/motion/SmoothScrollProvider";
import { showreel, a11y } from "@/content/de";

const LOCK = "showreel";
const FOCUSABLE = 'button, video, a[href], [tabindex]:not([tabindex="-1"])';

/**
 * A32 — showreel lightbox.
 *
 * Ink backdrop fades in while the 16:9 player opens out of a clip-path. Escape
 * and a backdrop click close it, scroll is locked while open, focus is trapped
 * and handed back to the trigger afterwards.
 *
 * With no video file present it shows the poster and caption rather than an
 * empty player.
 */
export function ShowreelLightbox({
  open,
  onClose,
  hasVideo,
}: {
  open: boolean;
  onClose: () => void;
  hasVideo: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLVideoElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const { lock, unlock } = useSmoothScroll();

  useEffect(() => {
    const element = root.current;
    if (!element) return;

    if (!open) {
      unlock(LOCK);
      player.current?.pause();
      gsap.to(element, {
        autoAlpha: 0,
        duration: 0.35,
        ease: EASE.out,
        onComplete: () => gsap.set(element, { display: "none" }),
      });
      opener.current?.focus?.();
      return;
    }

    opener.current = document.activeElement as HTMLElement | null;
    lock(LOCK);

    const frame = element.querySelector<HTMLElement>("[data-showreel-frame]");
    const reduced = prefersReducedMotion();

    gsap.set(element, { display: "grid" });
    const timeline = gsap.timeline();
    timeline.fromTo(element, { autoAlpha: 0 }, { autoAlpha: 1, duration: reduced ? 0.01 : 0.35, ease: EASE.out });
    if (frame && !reduced) {
      timeline.fromTo(
        frame,
        { scale: 0.92, clipPath: "inset(6% 0%)" },
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
      id="showreel"
      role="dialog"
      aria-modal="true"
      aria-label={a11y.lightboxLabel}
      aria-hidden={!open}
      inert={!open}
      className="fixed inset-0 z-[170] hidden place-items-center p-[var(--page-x)]"
      style={{ backgroundColor: "color-mix(in srgb, var(--ink) 92%, transparent)", visibility: "hidden" }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div data-showreel-frame className="relative w-full max-w-[1200px]">
        <div className="media-frame relative aspect-video w-full">
          {hasVideo ? (
            <video
              ref={player}
              className="h-full w-full object-cover"
              src={showreel.src}
              poster={showreel.poster}
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={showreel.poster}
              alt={showreel.title}
              className="h-full w-full object-cover"
              width={1920}
              height={1080}
            />
          )}
        </div>
        <div className="mt-4 flex items-start justify-between gap-6">
          <p className="t-mono" style={{ color: "var(--cream)" }}>
            {showreel.caption}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="t-mono link-underline min-h-[44px] shrink-0"
            style={{ color: "var(--amber)" }}
            data-cursor="link"
          >
            {a11y.closeLightbox}
          </button>
        </div>
      </div>
    </div>
  );
}
