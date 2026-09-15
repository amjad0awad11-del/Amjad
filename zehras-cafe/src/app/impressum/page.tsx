import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { legal } from "@/content/cafe";

export const metadata: Metadata = {
  title: legal.impressum.title,
  description:
    "Impressum von Zehra’s Baguette & Café, Oberwallstraße 55, 47441 Moers.",
  // Placeholder legal text should never be indexed. Remove this once the real
  // details are in place.
  robots: { index: false, follow: true },
};

export default function ImpressumPage() {
  return (
    <LegalPage
      title={legal.impressum.title}
      intro={legal.impressum.intro}
      blocks={legal.impressum.blocks}
      note={legal.impressum.note}
    />
  );
}
