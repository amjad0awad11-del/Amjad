"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { prefersReducedMotion } from "@/lib/motion";

type BackgroundVideoProps = {
  /** An `.m3u8` playlist streams through hls.js; anything else plays natively. */
  src: string;
  poster: string;
  /** Flips the clip vertically — the contact section runs the hero's clip upside down. */
  flip?: boolean;
  /** 0–1. How much ink sits between the clip and the copy on top of it. */
  overlay?: number;
  /** Fades the bottom edge into the section ground. */
  fade?: boolean;
  className?: string;
};

/**
 * Attaches an HLS playlist to a video element and hands back a teardown.
 *
 * Safari and iOS play `.m3u8` natively, so they never pay for the library;
 * everywhere else hls.js is fetched only once a playlist is actually in play.
 */
async function attachHls(video: HTMLVideoElement, src: string): Promise<() => void> {
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = src;
    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }

  const { default: Hls } = await import("hls.js");
  if (!Hls.isSupported()) return () => undefined;

  const hls = new Hls({ enableWorker: true });
  hls.loadSource(src);
  hls.attachMedia(video);
  return () => hls.destroy();
}

/**
 * Full-bleed background clip: centred, cropped to cover, with an ink wash and
 * an optional bottom fade over it.
 *
 * It only mounts once the section is close to the viewport, so a clip at the
 * foot of the page costs nothing until someone scrolls that far. Under reduced
 * motion the poster stands in and no video is fetched at all.
 */
export function BackgroundVideo({
  src,
  poster,
  flip = false,
  overlay = 0.2,
  fade = false,
  className,
}: BackgroundVideoProps) {
  const scope = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const element = scope.current;
    if (!element) return;
    if (prefersReducedMotion()) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setActive(true);
        observer.disconnect();
      },
      { rootMargin: "400px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const player = video.current;
    if (!active || !player) return;

    let detach: (() => void) | undefined;
    let cancelled = false;

    const start = async () => {
      if (src.endsWith(".m3u8")) {
        const teardown = await attachHls(player, src);
        if (cancelled) {
          teardown();
          return;
        }
        detach = teardown;
      } else {
        player.src = src;
      }
      // Autoplay can still be refused; the poster stays underneath either way.
      void player.play().catch(() => undefined);
    };

    void start();

    return () => {
      cancelled = true;
      player.pause();
      detach?.();
    };
  }, [active, src]);

  return (
    <div
      ref={scope}
      aria-hidden="true"
      className={clsx("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {active ? (
        <video
          ref={video}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          tabIndex={-1}
          className={clsx(
            "absolute left-1/2 top-1/2 h-full min-h-full w-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover",
            flip && "scale-y-[-1]"
          )}
        />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={poster}
          alt=""
          className={clsx(
            "absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover",
            flip && "scale-y-[-1]"
          )}
        />
      )}

      <div
        className="absolute inset-0"
        style={{ backgroundColor: `color-mix(in srgb, var(--ink) ${overlay * 100}%, transparent)` }}
      />

      {fade && (
        <div
          className="absolute inset-x-0 bottom-0 h-48"
          style={{ background: "linear-gradient(to top, var(--bg), transparent)" }}
        />
      )}
    </div>
  );
}
