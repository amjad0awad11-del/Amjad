"use client";

import { createContext, useContext } from "react";

/**
 * Carries "the preloader is finished" down to the hero so its timeline starts
 * on the reveal rather than behind the overlay. Everything else animates on
 * scroll and never reads this.
 */
const HeroReadyContext = createContext(false);

export function useHeroReady() {
  return useContext(HeroReadyContext);
}

export function HeroGate({ ready, children }: { ready: boolean; children: React.ReactNode }) {
  return <HeroReadyContext.Provider value={ready}>{children}</HeroReadyContext.Provider>;
}
