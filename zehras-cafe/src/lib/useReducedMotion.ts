"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * One lazily created MediaQueryList, shared by every caller. `getSnapshot` is
 * called on each render, so constructing a new list each time would be wasteful.
 */
let mediaQuery: MediaQueryList | null = null;

function getMediaQuery(): MediaQueryList | null {
  if (typeof window === "undefined") return null;
  mediaQuery ??= window.matchMedia(QUERY);
  return mediaQuery;
}

function subscribe(onStoreChange: () => void): () => void {
  const query = getMediaQuery();
  if (!query) return () => undefined;
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

const getSnapshot = (): boolean | null => getMediaQuery()?.matches ?? null;

/**
 * Returned during server rendering and throughout hydration. Deliberately
 * `null` rather than `false`: callers use it to mean "the preference is not
 * known yet", and hold off building any timeline until it resolves. Guessing
 * `false` here would start an animation for someone who asked for none and
 * then have to tear it down.
 */
const getServerSnapshot = (): boolean | null => null;

/**
 * Tracks `prefers-reduced-motion` as the external store it actually is, so a
 * visitor who flips the OS setting mid-visit is respected immediately — the
 * hero rebuilds or discards its timeline in response.
 *
 * Returns `null` until the first post-hydration read, then `true` / `false`.
 */
export function useReducedMotion(): boolean | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
