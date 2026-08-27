"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribes to a media query without a mount-time setState, so there is no
 * cascading render and the server snapshot stays explicit.
 *
 * Returns `null` on the server and during the first hydration pass, letting
 * components hold off on committing to a motion path until the query is known.
 */
function useMatchMedia(query: string): boolean | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = useCallback(() => null, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Tracks `prefers-reduced-motion: reduce`. */
export function useReducedMotion(): boolean | null {
  return useMatchMedia("(prefers-reduced-motion: reduce)");
}

/** Tracks an arbitrary media query (used for the ≥1024px desktop motion path). */
export function useMediaQuery(query: string): boolean | null {
  return useMatchMedia(query);
}
