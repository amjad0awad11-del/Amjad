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
import { Impressionen } from "@/components/sections/Impressionen";
import { Studio } from "@/components/sections/Studio";
import { Faq } from "@/components/sections/Faq";
import { Kontakt } from "@/components/sections/Kontakt";
import { hasAsset } from "@/lib/assets";
import { showreel } from "@/content/de";

export default function Home() {
  // Resolved at build time — the lightbox falls back to a still if the clip is missing.
  const hasShowreel = hasAsset(showreel.src);

  return (
    <Shell>
      <JsonLd />
      <Hero hasShowreel={hasShowreel} />
      <Ticker />
      <Manifest />
      <Leistungen />
      <Arbeiten />
      <Prozess />
      <Vergleich />
      <Preise />
      <Stimmen />
      <Impressionen />
      <Studio />
      <Faq />
      <Kontakt />
    </Shell>
  );
}
