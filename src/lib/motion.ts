/**
 * AMW — global motion system.
 * Every animation in the project imports its easing, duration, stagger and
 * ScrollTrigger start values from here. No component invents its own numbers.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Observer } from "gsap/Observer";

export const EASE = {
  out: "power3.out",
  expo: "expo.out",
  inOut: "power2.inOut",
  curtain: "expo.inOut",
  linear: "none",
  pop: "back.out(2)",
} as const;

export const DUR = {
  fast: 0.4,
  base: 0.8,
  slow: 1.2,
  curtain: 1.0,
  hero: 1.1,
} as const;

export const STAGGER = {
  chars: 0.02,
  words: 0.04,
  lines: 0.08,
  cards: 0.12,
} as const;

export const START = {
  default: "top 82%",
  early: "top 92%",
  pin: "top top",
} as const;

/** Breakpoint at which pinning / cursor / hover previews switch on. */
export const DESKTOP_QUERY = "(min-width: 1024px)";

let registered = false;

/** Registers the GSAP plugins exactly once, client-side only. */
export function registerGsap() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, Observer);
  registered = true;
}

/**
 * Registration has to happen at module evaluation, not in a provider effect:
 * child layout effects run before parent passive effects, so a component's
 * first ScrollTrigger would otherwise be created against an unlinked plugin.
 */
registerGsap();

/**
 * The single reduced-motion guard (§4.4). Components call this first and, when
 * it returns true, fall back to `simpleFade` instead of building a timeline.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True for coarse pointers (touch) — used to disable cursor and hover previews. */
export function isCoarsePointer(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  return window.matchMedia("(pointer: coarse)").matches;
}

/**
 * Reduced-motion fallback: content becomes visible with a plain opacity fade,
 * no transforms, no pinning, no scrub.
 */
export function simpleFade(
  targets: gsap.TweenTarget,
  vars: gsap.TweenVars = {}
): gsap.core.Tween {
  return gsap.fromTo(
    targets,
    { autoAlpha: 0 },
    { autoAlpha: 1, duration: DUR.fast, ease: EASE.out, clearProps: "transform", ...vars }
  );
}

/** Clamps a number into [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Maps scroll velocity (px/s, signed) to a skew angle clamped to ±max degrees.
 * Used by the velocity marquee (A9) and the media skew (A13).
 */
export function velocityToSkew(velocity: number, max = 4, divisor = 220): number {
  return clamp(velocity / divisor, -max, max);
}

/** Refreshes ScrollTrigger once the layout has settled (fonts, preloader, images). */
export function refreshScrollTrigger() {
  if (typeof window === "undefined") return;
  ScrollTrigger.refresh();
}

export { gsap, ScrollTrigger, Observer };
