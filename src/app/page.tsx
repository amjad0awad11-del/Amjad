import { Shell } from "@/components/layout/Shell";
import { Hero } from "@/components/sections/Hero";
import { Ticker } from "@/components/sections/Ticker";
import { Manifest } from "@/components/sections/Manifest";
import { Leistungen } from "@/components/sections/Leistungen";
import { Arbeiten } from "@/components/sections/Arbeiten";
import { Prozess } from "@/components/sections/Prozess";
import { hasAsset } from "@/lib/assets";
import { hero, arbeiten } from "@/content/de";

export default function Home() {
  // Resolved at build time: a missing clip degrades to its poster (see lib/assets).
  const heroHasVideo = hasAsset(hero.video);
  const workVideoFlags = arbeiten.items.map(
    (item) => item.kind === "video" && hasAsset(item.media)
  );

  return (
    <Shell>
      <Hero hasVideo={heroHasVideo} />
      <Ticker />
      <Manifest />
      <Leistungen />
      <Arbeiten videoFlags={workVideoFlags} />
      <Prozess />
      <section data-theme="dark" id="kontakt" className="section-y">
        <div className="wrap">
          <h2 className="t-h2">Kontakt</h2>
        </div>
      </section>
    </Shell>
  );
}
