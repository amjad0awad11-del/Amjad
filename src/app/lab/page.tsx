"use client";

/** Temporary Phase 1 checkpoint route. Deleted in Phase 7. */
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";
import { CustomCursor } from "@/components/motion/CustomCursor";
import { ScrollEffects } from "@/components/motion/ScrollEffects";
import { PageTransition } from "@/components/motion/PageTransition";
import { RevealText } from "@/components/motion/RevealText";
import { RevealMedia } from "@/components/motion/RevealMedia";
import { Counter } from "@/components/motion/Counter";
import { Marquee } from "@/components/motion/Marquee";
import { Button } from "@/components/ui/Button";

export default function Lab() {
  return (
    <SmoothScrollProvider>
      <PageTransition />
      <CustomCursor />
      <ScrollEffects />
      <main>
        <section data-theme="dark" className="section-y">
          <div className="wrap flex flex-col gap-10">
            <RevealText as="h1" className="t-display" variant="hero" immediate>
              Motion Lab
            </RevealText>
            <RevealText as="p" className="t-body t-muted">
              Jede Primitive einmal: Reveal, Media, Counter, Marquee, Magnet-Button, Parallax.
            </RevealText>
            <div className="flex flex-wrap gap-4">
              <Button label="Solid" href="#ende" />
              <Button label="Outline" href="#ende" variant="outline" />
            </div>
          </div>
        </section>

        <section data-theme="amber" className="py-10">
          <Marquee ariaLabel="Beispiel-Laufband">
            <span className="t-h2 whitespace-nowrap px-8 uppercase">Meta Ads ✦ Creatives ✦</span>
          </Marquee>
        </section>

        <section data-theme="light" className="section-y">
          <div className="wrap grid gap-12 md:grid-cols-2">
            <RevealMedia>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img data-reveal-inner src="/images/studio-1.jpg" alt="Platzhalter aus dem Studio" width={1200} height={900} />
            </RevealMedia>
            <div className="flex flex-col gap-8" data-parallax="0.08">
              <p className="t-display">
                <Counter value={128} suffix="+" />
              </p>
              <p className="t-body">Counter mit Suffix.</p>
            </div>
          </div>
        </section>

        <section data-theme="dark" className="section-y" id="ende">
          <div className="wrap">
            <RevealText as="h2" className="t-h2">
              Ende des Labs.
            </RevealText>
          </div>
        </section>
      </main>
    </SmoothScrollProvider>
  );
}
