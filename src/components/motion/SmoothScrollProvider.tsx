"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, registerGsap, prefersReducedMotion } from "@/lib/motion";

type ScrollApi = {
  /** Smooth-scrolls to a selector or element, clearing the fixed header. */
  scrollTo: (target: string | HTMLElement, offset?: number) => void;
  /**
   * Scroll locking is reference-counted by key, so the preloader, the menu and
   * the showreel lightbox can hold the lock at the same time without one of
   * them releasing it out from under the others.
   */
  lock: (key: string) => void;
  unlock: (key: string) => void;
};

const ScrollContext = createContext<ScrollApi | null>(null);

export function useSmoothScroll(): ScrollApi {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error("useSmoothScroll must be used inside <SmoothScrollProvider>");
  }
  return context;
}

const HEADER_OFFSET = -80;

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const locksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    registerGsap();

    // Reduced motion: no Lenis at all, the browser keeps native scrolling.
    if (prefersReducedMotion()) {
      return () => {
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      };
    }

    const lenis = new Lenis({
      lerp: 0.09,
      duration: 1.2,
      smoothWheel: true,
      syncTouch: false,
    });
    lenisRef.current = lenis;

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Anything still holding a lock when the engine starts keeps it.
    if (locksRef.current.size > 0) lenis.stop();

    // Late-arriving fonts change line boxes, which moves every trigger.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });

    // A resize invalidates every pin distance. ScrollTrigger refreshes itself on
    // window resize, but not when only the visual viewport changes (mobile
    // browser chrome sliding away), which is exactly when a pin drifts.
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onViewportChange = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 180);
    };
    window.visualViewport?.addEventListener("resize", onViewportChange);
    window.addEventListener("orientationchange", onViewportChange);

    return () => {
      cancelled = true;
      clearTimeout(resizeTimer);
      window.visualViewport?.removeEventListener("resize", onViewportChange);
      window.removeEventListener("orientationchange", onViewportChange);
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const applyLockState = useCallback(() => {
    const locked = locksRef.current.size > 0;
    const lenis = lenisRef.current;

    if (lenis) {
      if (locked) lenis.stop();
      else lenis.start();
      return;
    }

    // Reduced-motion path: hold the native scroll position instead.
    document.documentElement.style.overflow = locked ? "hidden" : "";
  }, []);

  const lock = useCallback(
    (key: string) => {
      locksRef.current.add(key);
      applyLockState();
    },
    [applyLockState]
  );

  const unlock = useCallback(
    (key: string) => {
      locksRef.current.delete(key);
      applyLockState();
    },
    [applyLockState]
  );

  const scrollTo = useCallback((target: string | HTMLElement, offset = HEADER_OFFSET) => {
    const lenis = lenisRef.current;

    if (lenis) {
      lenis.scrollTo(target, { offset, duration: 1.2 });
      return;
    }

    const element =
      typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top, behavior: "auto" });
  }, []);

  // Only the callbacks are exposed. Handing out lenisRef.current would mean
  // reading a ref during render and pinning a stale instance in the context.
  const value = useMemo<ScrollApi>(
    () => ({ scrollTo, lock, unlock }),
    [scrollTo, lock, unlock]
  );

  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>;
}
