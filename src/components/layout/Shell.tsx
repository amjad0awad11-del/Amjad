"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";
import { Preloader } from "@/components/motion/Preloader";
import { CustomCursor } from "@/components/motion/CustomCursor";
import { PageTransition } from "@/components/motion/PageTransition";
import { ScrollEffects } from "@/components/motion/ScrollEffects";
import { ThemeMorph } from "@/components/motion/ThemeMorph";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { Grain } from "@/components/motion/Atmosphere";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroGate } from "@/components/motion/HeroGate";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { a11y } from "@/content/de";

/**
 * The page shell: scroll engine, preloader, chrome and the atmosphere layer.
 * Every page renders its sections as children.
 */
export function Shell({ children }: { children: React.ReactNode }) {
  const [heroReady, setHeroReady] = useState(false);
  const reduced = useReducedMotion();
  const pathname = usePathname();
  const onHome = pathname === "/";

  const onPreloaderDone = useCallback(() => setHeroReady(true), []);

  return (
    <SmoothScrollProvider>
      <a href="#inhalt" className="skip-link">
        {a11y.skipLink}
      </a>

      <Preloader onDone={onPreloaderDone} />
      <PageTransition />
      <CustomCursor />
      <ScrollEffects />
      <ThemeMorph reduced={reduced === true} />
      <ScrollProgress reduced={reduced === true} />
      <Grain />

      <Header />

      <main id="inhalt" aria-label={a11y.mainLabel}>
        <HeroGate ready={heroReady}>{children}</HeroGate>
      </main>

      <Footer onHome={onHome} />
    </SmoothScrollProvider>
  );
}
