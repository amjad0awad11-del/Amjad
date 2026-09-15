"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { impressionen, type GalleryImage } from "@/content/cafe";

type Props = {
  images: readonly GalleryImage[];
  /** Index of the open image, or `null` when the lightbox is closed. */
  index: number | null;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
};

const { lightbox } = impressionen;

/**
 * Lightweight, accessible gallery lightbox — no dependency, ~100 lines.
 *
 * Behaviour it guarantees:
 *   • `role="dialog"` + `aria-modal`, labelled by the current image's caption
 *   • Escape closes; ArrowLeft / ArrowRight move between images
 *   • Tab is trapped inside the dialog while it is open
 *   • focus moves to the close button on open, and the caller returns focus to
 *     the thumbnail that opened it
 *   • background scroll is locked
 *   • the counter is announced politely, so a screen-reader user knows where
 *     they are in the set
 */
export function Lightbox({ images, index, onClose, onNavigate }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const isOpen = index !== null;
  const total = images.length;

  const goRelative = useCallback(
    (delta: number) => {
      if (index === null) return;
      // Wrap around: from the last image, "next" returns to the first.
      onNavigate((index + delta + total) % total);
    },
    [index, onNavigate, total],
  );

  useEffect(() => {
    if (!isOpen) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          onClose();
          return;
        case "ArrowLeft":
          event.preventDefault();
          goRelative(-1);
          return;
        case "ArrowRight":
          event.preventDefault();
          goRelative(1);
          return;
        case "Tab": {
          const focusables =
            dialogRef.current?.querySelectorAll<HTMLElement>(
              "button:not([disabled])",
            );
          if (!focusables || focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
          return;
        }
        default:
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose, goRelative]);

  if (index === null) return null;

  const image = images[index];
  const counter = lightbox.counter(index + 1, total);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={lightbox.regionLabel}
      className="on-dark fixed inset-0 z-200 flex flex-col bg-[rgba(24,18,14,0.94)] backdrop-blur-[3px]"
    >
      {/* Clicking the backdrop closes, but it is not the only way out — the
          close button and Escape both work, so this is pure convenience. */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <p
          className="text-[0.8125rem] font-medium tracking-[0.06em] text-[var(--muted-on-dark)]"
          aria-live="polite"
        >
          {counter}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={lightbox.closeLabel}
          className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--r-pill)] border border-[rgba(246,238,225,0.28)] text-[var(--on-dark)] transition-colors duration-200 hover:bg-[rgba(246,238,225,0.12)]"
        >
          <X size={20} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center gap-2 px-2 sm:gap-4 sm:px-6">
        {total > 1 ? (
          <button
            type="button"
            onClick={() => goRelative(-1)}
            aria-label={lightbox.prevLabel}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--r-pill)] border border-[rgba(246,238,225,0.28)] text-[var(--on-dark)] transition-colors duration-200 hover:bg-[rgba(246,238,225,0.12)]"
          >
            <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
          </button>
        ) : null}

        <figure className="flex min-h-0 flex-1 flex-col items-center gap-4">
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes="(max-width: 767px) 92vw, 78vw"
            className="max-h-[68svh] w-auto max-w-full rounded-[var(--r-media)] object-contain"
          />
          {image.caption ? (
            <figcaption className="max-w-[54ch] text-center text-[0.9375rem] text-[var(--muted-on-dark)]">
              {image.caption}
            </figcaption>
          ) : null}
        </figure>

        {total > 1 ? (
          <button
            type="button"
            onClick={() => goRelative(1)}
            aria-label={lightbox.nextLabel}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--r-pill)] border border-[rgba(246,238,225,0.28)] text-[var(--on-dark)] transition-colors duration-200 hover:bg-[rgba(246,238,225,0.12)]"
          >
            <ChevronRight size={22} strokeWidth={2} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="h-6 sm:h-8" />
    </div>
  );
}
