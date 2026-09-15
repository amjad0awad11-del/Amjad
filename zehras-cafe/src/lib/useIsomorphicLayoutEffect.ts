import { useEffect, useLayoutEffect } from "react";

/**
 * `useLayoutEffect` warns when it runs during server rendering. GSAP setup has
 * to happen before paint to avoid a flash of the un-animated state, so we use
 * the layout effect in the browser and fall back to `useEffect` on the server.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
