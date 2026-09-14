"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap, DUR, EASE, prefersReducedMotion, refreshScrollTrigger } from "@/lib/motion";
import { useSmoothScroll } from "@/components/motion/SmoothScrollProvider";
import { preloader } from "@/content/de";

const SESSION_KEY = "amw:preloaded";
const LOCK = "preloader";

/** Handheld plays the intro at double speed — see the note in the effect. */
const BRISK_RATE = 2;

/** Slack on top of the clip's own remaining runtime before the failsafe fires. */
const GRACE_MS = 2500;

/** Used until the clip reports a duration, and if it never does. */
const BLIND_FAILSAFE_MS = 6000;

/**
 * A1 — first-visit-per-session intro.
 *
 * The clip is the title card: wordmark, claim and the 1→100 impulse counter all
 * live inside the video, so the overlay draws nothing over it. When it ends, the
 * two ink panels split apart to reveal the page. Scroll is locked throughout and
 * the hero timeline waits on `onDone`.
 *
 * Under reduced motion, or on any later navigation in the same session, it never
 * mounts and the hero plays immediately. Nothing can strand the visitor behind
 * the overlay: a refused autoplay, a codec the browser will not decode, a stalled
 * download or a clip that never reaches `ended` all fall through to the reveal,
 * and `Esc` or the skip control cut it short at any point.
 */
export function Preloader({ onDone }: { onDone: () => void }) {
  const { lock, unlock } = useSmoothScroll();
  const scope = useRef<HTMLDivElement>(null);
  const finished = useRef(false);
  const revealing = useRef(false);
  const revealRef = useRef<() => void>(() => undefined);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Private mode blocks sessionStorage; the preloader just runs again.
    }
    document.documentElement.classList.remove("amw-preload");
    unlock(LOCK);
    refreshScrollTrigger();
    onDone();
  }, [onDone, unlock]);

  useEffect(() => {
    // The blocking script in <head> already decided this, before first paint,
    // and the .amw-preload class is what shows the overlay. Keeping that the
    // single source of truth means no React state and no mount-time re-render.
    const shouldRun = document.documentElement.classList.contains("amw-preload");
    const root = scope.current;

    if (!shouldRun || prefersReducedMotion() || !root) {
      finished.current = true;
      document.documentElement.classList.remove("amw-preload");
      onDone();
      return;
    }

    lock(LOCK);

    const video = root.querySelector<HTMLVideoElement>("[data-preloader-video]");
    const skip = root.querySelector<HTMLElement>("[data-preloader-skip]");

    // Handheld gets the intro at double speed: the overlay is what Lighthouse
    // measures as the largest paint, and eight seconds on cellular is a cost the
    // visitor pays for a flourish. The counter still runs its full 1→100.
    const brisk = window.matchMedia("(max-width: 1023px)").matches;
    const rate = brisk ? BRISK_RATE : 1;

    let failsafe = 0;
    const arm = (ms: number) => {
      window.clearTimeout(failsafe);
      failsafe = window.setTimeout(() => revealRef.current(), ms);
    };

    const context = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>("[data-preloader-panel]");

      // The curtain: the clip pushes in as the ink splits, so the intro hands
      // the page over rather than simply switching off.
      const reveal = () => {
        if (revealing.current || finished.current) return;
        revealing.current = true;
        window.clearTimeout(failsafe);

        gsap
          .timeline({ onComplete: finish })
          .to([video, panels], { scale: 1.08, duration: DUR.curtain, ease: EASE.curtain }, 0)
          .to(
            panels,
            {
              yPercent: (index) => (index === 0 ? -101 : 101),
              duration: DUR.curtain,
              ease: EASE.curtain,
            },
            "<"
          )
          .to([video, skip], { autoAlpha: 0, duration: DUR.fast, ease: EASE.out }, "<");
      };

      revealRef.current = reveal;
      // Covers the window before the clip has told us anything about itself.
      arm(BLIND_FAILSAFE_MS);
    }, root);

    // `ended` is the intended exit; the rest are the ways it can fail to arrive.
    const onEnded = () => revealRef.current();
    const onFailure = () => finish();

    // Re-armed from what is actually left to play, so a stall is caught in
    // seconds instead of holding the overlay for the clip's full runtime.
    const onProgress = () => {
      if (!video || !Number.isFinite(video.duration)) return;
      const remaining = Math.max(video.duration - video.currentTime, 0);
      arm((remaining / rate) * 1000 + GRACE_MS);
    };

    if (video) {
      video.addEventListener("ended", onEnded);
      video.addEventListener("error", onFailure);
      video.addEventListener("loadedmetadata", onProgress);
      video.addEventListener("timeupdate", onProgress);

      // src and poster are attached here rather than in the markup: the overlay
      // ships on every route, and an element that already carries a source would
      // pull the clip down again on repeat visits and under reduced motion, when
      // it is never going to play.
      video.preload = "auto";
      video.poster = preloader.poster;
      video.src = preloader.video;
      video.playbackRate = rate;
      // A refused autoplay must not hold the page hostage behind a still frame.
      void video.play().catch(onFailure);
    } else {
      finish();
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") revealRef.current();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(failsafe);
      document.removeEventListener("keydown", onKey);
      video?.removeEventListener("ended", onEnded);
      video?.removeEventListener("error", onFailure);
      video?.removeEventListener("loadedmetadata", onProgress);
      video?.removeEventListener("timeupdate", onProgress);
      context.revert();
    };
  }, [lock, onDone, finish]);

  return (
    <div
      ref={scope}
      className="preloader fixed inset-0 z-[180]"
      role="status"
      aria-live="polite"
      aria-label={preloader.label}
    >
      <div className="absolute inset-0 flex flex-col">
        <div
          data-preloader-panel
          className="h-1/2 w-full"
          style={{ backgroundColor: "var(--ink)" }}
        />
        <div
          data-preloader-panel
          className="h-1/2 w-full"
          style={{ backgroundColor: "var(--ink)" }}
        />
      </div>

      {/* Decorative: the counter it runs is a flourish, not information the
          visitor needs, and the region above already announces itself. */}
      <video
        data-preloader-video
        className="preloader-video pointer-events-none absolute inset-0 h-full w-full"
        muted
        playsInline
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
      />

      <div className="absolute inset-x-0 bottom-[var(--page-x)] flex justify-center">
        <button
          type="button"
          data-preloader-skip
          data-qa-transient
          onClick={() => revealRef.current()}
          className="t-mono rounded-full border px-4 py-2 transition-colors"
          style={{ borderColor: "var(--hairline)", color: "var(--ash-on-dark)" }}
        >
          {preloader.skip}
        </button>
      </div>
    </div>
  );
}
