"use client";

import type { DependencyList, RefObject } from "react";
import { gsap, registerGsap } from "./motion";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

/**
 * Runs a GSAP setup function inside a scoped context and reverts it on cleanup,
 * so no ScrollTrigger or tween outlives its component (§4.3).
 *
 * The callback runs in a layout effect: initial states are written before paint,
 * which is what keeps entrance animations from flashing their end state first.
 */
export function useGsap(
  factory: (context: gsap.Context) => void,
  scope: RefObject<HTMLElement | null>,
  deps: DependencyList = []
) {
  useIsomorphicLayoutEffect(() => {
    const element = scope.current;
    if (!element) return;
    registerGsap();
    const context = gsap.context(factory, element);
    return () => context.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
