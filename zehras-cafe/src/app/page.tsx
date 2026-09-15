import { JsonLd } from "@/components/JsonLd";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/hero/Hero";
import { ScrollReveals } from "@/components/motion/ScrollReveals";
import { Auswahl } from "@/components/sections/Auswahl";
import { BesuchUns } from "@/components/sections/BesuchUns";
import { Gaestestimmen } from "@/components/sections/Gaestestimmen";
import { Impressionen } from "@/components/sections/Impressionen";
import { Intro } from "@/components/sections/Intro";
import { SocialMedia } from "@/components/sections/SocialMedia";
import { UeberUns } from "@/components/sections/UeberUns";

export default function Home() {
  return (
    <>
      <a href="#inhalt" className="skip-link">
        Zum Inhalt springen
      </a>

      <Header />

      <main id="inhalt">
        <Hero />
        <Intro />
        <Auswahl />
        <UeberUns />
        <Impressionen />
        {/* Renders only when verified review data exists in the content file. */}
        <Gaestestimmen />
        <BesuchUns />
        <SocialMedia />
      </main>

      <Footer />

      {/* Mounted last: it arms the scroll reveals only once everything above is
          in the DOM, and renders no markup of its own. */}
      <ScrollReveals />
      <JsonLd />
    </>
  );
}
