import { Shell } from "@/components/layout/Shell";
import { Hero } from "@/components/sections/Hero";
import { Ticker } from "@/components/sections/Ticker";
import { hasAsset } from "@/lib/assets";
import { hero } from "@/content/de";

export default function Home() {
  // Resolved at build time: a missing clip degrades to its poster (see lib/assets).
  const heroHasVideo = hasAsset(hero.video);

  return (
    <Shell>
      <Hero hasVideo={heroHasVideo} />
      <Ticker />
      <section data-theme="dark" id="kontakt" className="section-y">
        <div className="wrap">
          <h2 className="t-h2">Kontakt</h2>
        </div>
      </section>
    </Shell>
  );
}
