"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { heroVideo } from "@/content/cafe";

type Props = {
  /** `null` while the media query has not been read yet. */
  reducedMotion: boolean | null;
};

/**
 * The supplied clip, shown inside the hero's café-display card.
 *
 * Playback contract (all of it required by the brief):
 *   • muted + playsInline, `preload="metadata"` — never the full file up front
 *   • no `autoplay` attribute: playback starts only once the hero is actually
 *     on screen, driven by an IntersectionObserver
 *   • no `loop`: it plays once and holds on its final frame
 *   • pauses again when scrolled far out of view, so it costs nothing while the
 *     guest reads the menu
 *   • reduced motion: nothing plays until the guest explicitly asks for it
 *   • native controls stay off until the guest opts in
 *   • if the file cannot load, the whole card falls back to a static poster and
 *     the page carries on working
 */
export function HeroVideo({ reducedMotion }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  /** Reduced-motion guests press play themselves; then they get real controls. */
  const [optedIn, setOptedIn] = useState(false);

  /**
   * Is the media definitively unusable?
   *
   * `NETWORK_NO_SOURCE` (3) plus a populated `error` is the browser telling us
   * it gave up on the resource — a blocked host, a 404, an undecodable file.
   */
  const isBroken = (video: HTMLVideoElement) =>
    video.error !== null || video.networkState === video.NETWORK_NO_SOURCE;

  /**
   * Autoplay policies only allow a programmatic play() on a muted video, and
   * React sets `muted` as a property rather than an attribute, so we assert it
   * here too before ever calling play().
   */
  const safePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    void video.play().catch(() => {
      // A rejection can simply mean the browser declined (a policy call, or the
      // element was scrolled away mid-request) — that is not worth surfacing.
      // But it is also how a dead resource shows up, so re-check the element.
      if (isBroken(video)) setFailed(true);
    });
  }, []);

  /**
   * Failure detection, deliberately not relying on React's `onError`.
   *
   * The media `error` event does not bubble and frequently fires *before* React
   * has attached its handler — with a blocked host the element already reports
   * `error.code = 4` / `networkState = 3` by the time the component's effects
   * run, and `onError` never sees it. Measured, not assumed: without this
   * effect the hero silently keeps a dead <video> instead of falling back.
   *
   * So: check synchronously on mount, listen imperatively from then on, and
   * re-check once more shortly after in case the resource dies slightly later.
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const recheck = () => {
      if (isBroken(video)) setFailed(true);
    };

    recheck();
    video.addEventListener("error", recheck);
    // Covers a failure that lands between mount and the first paint-idle tick.
    const timer = window.setTimeout(recheck, 1500);

    return () => {
      video.removeEventListener("error", recheck);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container || failed) return;
    // Hold off until we know the preference; reduced motion never autostarts.
    if (reducedMotion === null) return;

    if (reducedMotion) {
      video.pause();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Comfortably in view: begin the clip, unless it already finished —
          // replaying it on every scroll-by would be exactly the kind of
          // looping the brief rules out.
          if (entry.intersectionRatio >= 0.35) {
            if (!video.ended) safePlay();
          } else if (entry.intersectionRatio < 0.1) {
            video.pause();
          }
        }
      },
      { threshold: [0, 0.1, 0.35, 0.6] },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [failed, reducedMotion, safePlay]);

  /** Manual toggle — also the WCAG 2.2.2 pause mechanism for moving content. */
  const toggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      if (video.ended) video.currentTime = 0;
      safePlay();
    } else {
      video.pause();
    }
  }, [safePlay]);

  const startForReducedMotion = useCallback(() => {
    setOptedIn(true);
    safePlay();
  }, [safePlay]);

  /* ------------------------------------------------------------------ */
  /* Video failed to load — premium static hero, page fully usable       */
  /* ------------------------------------------------------------------ */
  if (failed) {
    return (
      <div ref={containerRef} className="relative h-full w-full">
        <Image
          src={heroVideo.poster}
          alt={heroVideo.ariaLabel}
          fill
          // The hero is the largest element above the fold: load it eagerly and
          // tell the browser it is the LCP candidate.
          priority
          sizes="(max-width: 899px) 100vw, 1200px"
          className="object-cover"
        />
        <div className="hero-glass" aria-hidden="true" />
      </div>
    );
  }

  const showPlayOverlay = reducedMotion === true && !optedIn;

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <video
        ref={videoRef}
        src={heroVideo.src}
        poster={heroVideo.poster}
        muted
        playsInline
        preload="metadata"
        // Deliberately absent: autoplay, loop, controls.
        controls={optedIn}
        aria-label={heroVideo.ariaLabel}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setEnded(true);
        }}
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      >
        {/* Read out if the element cannot render at all. */}
        {heroVideo.fallbackText}
      </video>

      <div className="hero-glass" aria-hidden="true" />

      {showPlayOverlay ? (
        <button
          type="button"
          className="hero-media-play on-dark"
          onClick={startForReducedMotion}
        >
          <span>
            <Play size={16} strokeWidth={2.25} aria-hidden="true" />
            Video abspielen
          </span>
        </button>
      ) : (
        <button
          type="button"
          className="hero-media-toggle on-dark no-print"
          onClick={toggle}
          aria-label={
            playing
              ? "Video anhalten"
              : ended
                ? "Video erneut abspielen"
                : "Video abspielen"
          }
        >
          {playing ? (
            <Pause size={16} strokeWidth={2.25} aria-hidden="true" />
          ) : (
            <Play size={16} strokeWidth={2.25} aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
}
