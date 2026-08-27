import { Shell } from "@/components/layout/Shell";
import { JsonLd } from "@/components/JsonLd";
import { Hero } from "@/components/sections/Hero";
import { Ticker } from "@/components/sections/Ticker";
import { Manifest } from "@/components/sections/Manifest";
import { Leistungen } from "@/components/sections/Leistungen";
import { Arbeiten } from "@/components/sections/Arbeiten";
import { Prozess } from "@/components/sections/Prozess";
import { Vergleich } from "@/components/sections/Vergleich";
import { Preise } from "@/components/sections/Preise";
import { Stimmen } from "@/components/sections/Stimmen";
import { Studio } from "@/components/sections/Studio";
import { Faq } from "@/components/sections/Faq";
import { Kontakt } from "@/components/sections/Kontakt";
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
      <JsonLd />
      <Hero hasVideo={heroHasVideo} />
      <Ticker />
      <Manifest />
      <Leistungen />
      <Arbeiten videoFlags={workVideoFlags} />
      <Prozess />
      <Vergleich />
      <Preise />
      <Stimmen />
      <Studio />
      <Faq />
      <Kontakt />
    </Shell>
  );
}
