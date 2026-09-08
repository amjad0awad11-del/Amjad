"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, EASE, START, clamp, DESKTOP_QUERY, prefersReducedMotion } from "@/lib/motion";
import { useGsap } from "@/lib/useGsap";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { arbeiten } from "@/content/de";

type WorkItem = (typeof arbeiten.items)[number];

/**
 * A16 — work card.
 *
 * The clip plays whenever the card is in view; hover and keyboard focus lift
 * it, wash it out behind a blur and float the "Ansehen" pill up over it, with
 * the meta line rising out of its mask underneath. A halftone dot screen sits
 * over the clip throughout. No poster file exists for these clips, so the frame
 * carries its own ground colour until the first frame paints.
 */
function WorkCard({ item, index }: { item: WorkItem; index: number }) {
  const scope = useRef<HTMLLIElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  // The first two mount immediately; the rest wait until they are close.
  const [mounted, setMounted] = useState(index < 2);

  useEffect(() => {
    const element = scope.current;
    if (!element) return;

    // Mount well before the card arrives so it is ready when it does.
    const prepare = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setMounted(true);
        prepare.disconnect();
      },
      { rootMargin: "600px" }
    );
    prepare.observe(element);
    return () => prepare.disconnect();
  }, []);

  useEffect(() => {
    const element = scope.current;
    const player = video.current;
    if (!element || !player) return;

    // Only decode what is actually on screen.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (player.preload !== "auto") player.preload = "auto";
          void player.play().catch(() => undefined);
        } else {
          player.pause();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [mounted]);

  useEffect(() => {
    const element = scope.current;
    if (!element || prefersReducedMotion()) return;

    const frame = element.querySelector<HTMLElement>("[data-work-frame]");
    const meta = element.querySelector<HTMLElement>("[data-work-meta]");
    const wash = element.querySelector<HTMLElement>("[data-work-wash]");
    const pill = element.querySelector<HTMLElement>("[data-work-pill]");
    gsap.set(meta, { yPercent: 100 });
    gsap.set([wash, pill].filter(Boolean) as HTMLElement[], { autoAlpha: 0 });
    gsap.set(pill, { y: 12, scale: 0.96 });

    const activate = (on: boolean) => {
      gsap.to(frame, { scale: on ? 1.04 : 1, duration: 0.6, ease: EASE.out });
      gsap.to(meta, { yPercent: on ? 0 : 100, duration: 0.5, ease: EASE.out });
      gsap.to(wash, { autoAlpha: on ? 1 : 0, duration: 0.45, ease: EASE.out });
      gsap.to(pill, {
        autoAlpha: on ? 1 : 0,
        y: on ? 0 : 12,
        scale: on ? 1 : 0.96,
        duration: 0.45,
        ease: EASE.out,
      });
    };

    // Touch has no hover, so the meta line simply stays visible and the wash
    // never runs — there is no pointer to reveal it with.
    if (window.matchMedia("(pointer: coarse)").matches) {
      gsap.set(meta, { yPercent: 0 });
      return;
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
      gsap.killTweensOf([frame, meta, wash, pill].filter(Boolean) as HTMLElement[]);
    };
  }, []);

  return (
    <li
      ref={scope}
      data-work-card
      className="relative flex shrink-0 snap-center flex-col lg:snap-align-none"
      data-cursor="media"
      tabIndex={0}
      aria-label={item.alt}
    >
      <div
        data-work-frame
        className="relative aspect-[9/16] h-[clamp(360px,54vh,640px)] w-[clamp(240px,25vw,400px)] overflow-hidden rounded-[var(--r-media)] lg:h-full lg:w-auto"
        style={{ backgroundColor: "color-mix(in srgb, var(--cream) 7%, transparent)" }}
      >
        {mounted && (
          <video
            ref={video}
            className="h-full w-full object-cover"
            src={item.media}
            muted
            loop
            playsInline
            preload={index < 2 ? "metadata" : "none"}
            aria-hidden="true"
            tabIndex={-1}
          />
        )}

        {/* Dot screen over the clip, and the blurred wash the pill floats on. */}
        <div className="halftone pointer-events-none absolute inset-0" aria-hidden="true" />

        <div
          data-work-wash
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 grid place-items-center backdrop-blur-lg"
          style={{
            backgroundColor: "color-mix(in srgb, var(--ink) 70%, transparent)",
            visibility: "hidden",
          }}
        >
          <span
            data-work-pill
            className="gradient-ring-host relative inline-flex max-w-[86%] flex-wrap items-center justify-center gap-x-2 gap-y-0 rounded-[var(--r-pill)] px-5 py-2.5 text-center"
            style={{ backgroundColor: "var(--cream)", color: "var(--ink)" }}
          >
            <span className="gradient-ring gradient-ring-always" />
            <span className="t-mono">{arbeiten.cursorLabel}</span>
            <span className="t-mono opacity-40">—</span>
            <span className="t-body font-semibold">{item.client}</span>
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 overflow-hidden">
          <div
            data-work-meta
            className="p-5"
            style={{
              background:
                "linear-gradient(to top, color-mix(in srgb, var(--ink) 90%, transparent), transparent)",
            }}
          >
            <p className="t-h3" style={{ color: "var(--cream)" }}>
              {item.client}
            </p>
          </div>
        </div>
      </div>

      <p className="t-mono t-muted mt-4 shrink-0">
        {item.category} · {item.type} · {item.year}
      </p>
    </li>
  );
}

/**
 * S6 — Arbeiten.
 *
 * A15: on desktop the section pins and the track scrubs sideways. Cards tilt
 * and scale through the centre of the viewport, so the row reads as depth
 * rather than a flat strip. Below 1024px and under reduced motion it is a plain
 * horizontal scroller — no pin, no scroll-jacking.
 */
export function Arbeiten() {
  const scope = useRef<HTMLElement>(null);

  useGsap(
    () => {
      const root = scope.current;
      const track = root?.querySelector<HTMLElement>("[data-work-track]");
      const bar = root?.querySelector<HTMLElement>("[data-work-bar]");
      if (!root || !track) return;

      const context = gsap.matchMedia();

      // ---------------------------------------------------------------------
      // Touch and narrow screens: no pin (a pin fights the address bar and the
      // browser's own scrolling), but the same depth treatment, driven by the
      // native horizontal scroll so it stays completely in the user's hands.
      // ---------------------------------------------------------------------
      context.add(
        { handheld: `(max-width: 1023px) and (prefers-reduced-motion: no-preference)` },
        (state) => {
          if (!state.conditions?.handheld) return;
          const viewport = track.parentElement;
          if (!viewport) return;

          const cards = gsap.utils.toArray<HTMLElement>("[data-work-card]", root);
          const frames = cards.map((card) => card.firstElementChild as HTMLElement);

          // Offsets are measured once and on resize; reading them per scroll
          // event forces a layout on a device that can least afford one.
          let centres: number[] = [];
          let half = 0;
          const measure = () => {
            half = viewport.clientWidth / 2;
            centres = cards.map((card) => card.offsetLeft + card.offsetWidth / 2);
          };

          let queued = false;
          const shape = () => {
            queued = false;
            if (half === 0) return;
            const left = viewport.scrollLeft;
            for (let i = 0; i < cards.length; i += 1) {
              const offset = (centres[i] - left - half) / half;
              const near = 1 - Math.min(Math.abs(offset), 1);
              gsap.set(cards[i], { scale: 0.88 + near * 0.12 });
              gsap.set(frames[i], { opacity: 0.5 + near * 0.5 });
            }
          };
          const onScroll = () => {
            if (queued) return;
            queued = true;
            requestAnimationFrame(shape);
          };
          const onResize = () => {
            measure();
            onScroll();
          };

          measure();
          shape();
          viewport.addEventListener("scroll", onScroll, { passive: true });
          window.addEventListener("resize", onResize);

          return () => {
            viewport.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onResize);
            gsap.set(cards, { clearProps: "transform" });
            gsap.set(frames, { clearProps: "opacity" });
          };
        }
      );

      context.add(
        { desktop: `${DESKTOP_QUERY} and (prefers-reduced-motion: no-preference)` },
        (state) => {
          if (!state.conditions?.desktop) return;

          const distance = () => Math.max(0, track.scrollWidth - window.innerWidth * 0.9);
          if (distance() <= 0) return;

          const scrub = {
            trigger: root,
            start: START.pin,
            end: () => `+=${distance()}`,
            scrub: 1,
            invalidateOnRefresh: true,
          } as const;

          const tween = gsap.to(track, {
            x: () => -distance(),
            ease: EASE.linear,
            scrollTrigger: { ...scrub, pin: true, anticipatePin: 1 },
          });

          if (bar) {
            gsap.set(bar, { scaleX: 0, transformOrigin: "left center" });
            gsap.to(bar, { scaleX: 1, ease: EASE.linear, scrollTrigger: scrub });
          }

          // Depth pass: each card leans toward the centre line and stands
          // tallest as it crosses it.
          //
          // Positions are derived from cached offsets plus the track's current
          // x rather than read per frame — measuring each card mid-scroll forces
          // a layout on every write and was costing ~130ms of blocking time.
          const cards = gsap.utils.toArray<HTMLElement>("[data-work-card]", root);
          const frames = cards.map((card) => card.firstElementChild as HTMLElement);
          let metrics: { centre: number }[] = [];
          const measure = () => {
            metrics = cards.map((card) => ({
              centre: card.offsetLeft + card.offsetWidth / 2,
            }));
          };

          const shape = () => {
            if (metrics.length === 0) return;
            const half = window.innerWidth / 2;
            const shift = (gsap.getProperty(track, "x") as number) ?? 0;
            const base = track.offsetLeft;
            for (let i = 0; i < cards.length; i += 1) {
              const offset = (base + metrics[i].centre + shift - half) / half;
              const near = 1 - Math.min(Math.abs(offset), 1);
              // gsap.set, not quickSetter: quickSetter cannot take the `scale`
              // shorthand and throws on the expanded scaleX,scaleY name.
              gsap.set(cards[i], {
                rotationY: clamp(offset * -22, -22, 22),
                scale: 0.82 + near * 0.18,
                z: near * 140,
              });
              gsap.set(frames[i], { opacity: 0.45 + near * 0.55 });
            }
          };

          gsap.set(track, { perspective: 1100, transformStyle: "preserve-3d" });
          const depth = ScrollTrigger.create({
            ...scrub,
            onUpdate: shape,
            onRefresh: () => {
              measure();
              shape();
            },
          });
          measure();
          shape();

          return () => {
            depth.kill();
            tween.kill();
            gsap.set(cards, { clearProps: "transform" });
            gsap.set(frames, { clearProps: "opacity" });
          };
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
        className="mt-14 min-h-0 snap-x snap-mandatory overflow-x-auto scroll-smooth lg:mt-10 lg:flex-1 lg:snap-none lg:overflow-visible"
        style={{ scrollbarWidth: "none" }}
      >
        <ul
          data-work-track
          className="flex h-full gap-[var(--gutter)] px-[var(--page-x)] pb-2 lg:w-max"
        >
          {arbeiten.items.map((item, index) => (
            <WorkCard key={item.media} item={item} index={index} />
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
