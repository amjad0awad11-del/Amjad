"use client";

import { useEffect, useRef } from "react";
import { gsap, EASE, START, DESKTOP_QUERY, prefersReducedMotion } from "@/lib/motion";
import { useGsap } from "@/lib/useGsap";
import { RevealMedia } from "@/components/motion/RevealMedia";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { arbeiten } from "@/content/de";

type WorkItem = (typeof arbeiten.items)[number];

/**
 * A16 — work card.
 *
 * Poster scales up on hover while the muted loop fades in and plays; leaving
 * pauses and rewinds it. Focus does the same thing, and on touch the video
 * plays once the card is 60% in view instead of on hover (§8).
 */
function WorkCard({ item, hasVideo }: { item: WorkItem; hasVideo: boolean }) {
  const scope = useRef<HTMLLIElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = scope.current;
    const player = video.current;
    if (!element) return;

    const reduced = prefersReducedMotion();
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const poster = element.querySelector<HTMLElement>("[data-work-poster]");
    const meta = element.querySelector<HTMLElement>("[data-work-meta]");

    const activate = (on: boolean) => {
      if (!reduced) {
        gsap.to(poster, { scale: on ? 1.06 : 1, duration: 0.6, ease: EASE.out });
        gsap.to(meta, { yPercent: on ? 0 : 100, duration: 0.5, ease: EASE.out });
      }
      if (!player) return;
      gsap.to(player, { autoAlpha: on ? 1 : 0, duration: 0.4, ease: EASE.out });
      if (on) {
        void player.play().catch(() => undefined);
      } else {
        player.pause();
        player.currentTime = 0;
      }
    };

    if (!reduced) gsap.set(meta, { yPercent: 100 });
    if (player) gsap.set(player, { autoAlpha: 0 });

    // Touch: no hover to rely on, so play when the card is mostly in view.
    if (coarse) {
      if (!reduced) gsap.set(meta, { yPercent: 0 });
      if (!player) return;
      const observer = new IntersectionObserver(
        ([entry]) => activate(entry.intersectionRatio >= 0.6),
        { threshold: [0, 0.6] }
      );
      observer.observe(element);
      return () => observer.disconnect();
    }

    const enter = () => activate(true);
    const leave = () => activate(false);

    element.addEventListener("pointerenter", enter);
    element.addEventListener("pointerleave", leave);
    element.addEventListener("focusin", enter);
    element.addEventListener("focusout", leave);

    return () => {
      element.removeEventListener("pointerenter", enter);
      element.removeEventListener("pointerleave", leave);
      element.removeEventListener("focusin", enter);
      element.removeEventListener("focusout", leave);
      gsap.killTweensOf([poster, meta, player].filter(Boolean) as HTMLElement[]);
    };
  }, []);

  return (
    <li ref={scope} data-work-card className="relative flex shrink-0 flex-col">
      <RevealMedia
        className="relative aspect-[9/16] h-[clamp(360px,52vh,620px)] w-[clamp(260px,26vw,420px)] lg:h-full lg:w-auto"
        data-skew
      >
        <div data-work-poster data-reveal-inner className="absolute inset-0 will-change-transform">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.poster}
            alt={item.alt}
            width={1080}
            height={1920}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>

        {hasVideo && (
          <video
            ref={video}
            className="absolute inset-0 h-full w-full object-cover"
            src={item.media}
            poster={item.poster}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            tabIndex={-1}
          />
        )}

        <div className="absolute inset-x-0 bottom-0 overflow-hidden">
          <div
            data-work-meta
            className="p-5"
            style={{
              background: "linear-gradient(to top, color-mix(in srgb, var(--ink) 88%, transparent), transparent)",
            }}
          >
            <p className="t-h3" style={{ color: "var(--cream)" }}>
              {item.client}
            </p>
          </div>
        </div>
      </RevealMedia>

      <p className="t-mono t-muted mt-4 shrink-0">
        {item.category} · {item.type} · {item.year}
      </p>
    </li>
  );
}

/**
 * S6 — Arbeiten.
 *
 * A15: on desktop the section pins and the track scrubs sideways with an amber
 * progress bar. Below 1024px, under reduced motion, and whenever the track
 * would fit anyway, it stays a normal vertical list — no pin, no scroll-jacking.
 */
export function Arbeiten({ videoFlags }: { videoFlags: boolean[] }) {
  const scope = useRef<HTMLElement>(null);

  useGsap(
    () => {
      const root = scope.current;
      const viewport = root?.querySelector<HTMLElement>("[data-work-viewport]");
      const track = root?.querySelector<HTMLElement>("[data-work-track]");
      const bar = root?.querySelector<HTMLElement>("[data-work-bar]");
      if (!root || !viewport || !track) return;

      const context = gsap.matchMedia();

      context.add(
        { desktop: `${DESKTOP_QUERY} and (prefers-reduced-motion: no-preference)` },
        (state) => {
          if (!state.conditions?.desktop) return;

          const distance = () => Math.max(0, track.scrollWidth - window.innerWidth * 0.92);
          if (distance() <= 0) return;

          const tween = gsap.to(track, {
            x: () => -distance(),
            ease: EASE.linear,
            scrollTrigger: {
              trigger: root,
              start: START.pin,
              end: () => `+=${distance()}`,
              scrub: 1,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          if (bar) {
            gsap.set(bar, { scaleX: 0, transformOrigin: "left center" });
            gsap.to(bar, {
              scaleX: 1,
              ease: EASE.linear,
              scrollTrigger: {
                trigger: root,
                start: START.pin,
                end: () => `+=${distance()}`,
                scrub: 1,
                invalidateOnRefresh: true,
              },
            });
          }

          return () => tween.kill();
        }
      );

      return () => context.revert();
    },
    scope,
    []
  );

  return (
    <section
      ref={scope}
      id={arbeiten.id}
      data-theme="dark"
      aria-labelledby="arbeiten-title"
      className="section-y flex flex-col overflow-hidden lg:h-[100dvh] lg:justify-between lg:py-[clamp(72px,9vh,110px)]"
    >
      <div className="wrap flex flex-col gap-10">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeader label={arbeiten.label} title={arbeiten.title} titleId="arbeiten-title" />
          <p className="t-mono t-muted max-w-[34ch]">{arbeiten.note}</p>
        </div>
      </div>

      <div
        data-work-viewport
        className="mt-14 min-h-0 overflow-x-auto lg:mt-10 lg:flex-1 lg:overflow-visible"
      >
        <ul
          data-work-track
          className="flex h-full gap-[var(--gutter)] px-[var(--page-x)] pb-2 lg:w-max"
        >
          {arbeiten.items.map((item, index) => (
            <WorkCard key={item.client + item.year} item={item} hasVideo={videoFlags[index]} />
          ))}
        </ul>
      </div>

      <div className="wrap mt-10 hidden lg:block">
        <span className="block h-px w-full" style={{ backgroundColor: "var(--hairline)" }}>
          <span
            data-work-bar
            className="block h-px w-full origin-left"
            style={{ backgroundColor: "var(--amber)", transform: "scaleX(0)" }}
          />
        </span>
      </div>
    </section>
  );
}
