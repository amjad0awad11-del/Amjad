import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { legal } from "@/content/cafe";

export const metadata: Metadata = {
  title: legal.datenschutz.title,
  description:
    "Datenschutzerklärung von Zehra’s Baguette & Café, Oberwallstraße 55, 47441 Moers.",
  // Placeholder legal text should never be indexed. Remove this once the real
  // details are in place.
  robots: { index: false, follow: true },
};

export default function DatenschutzPage() {
  return (
    <LegalPage
      title={legal.datenschutz.title}
      intro={legal.datenschutz.intro}
      blocks={legal.datenschutz.blocks}
      note={legal.datenschutz.note}
    />
  );
}
