import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { rechtliches } from "@/content/de";

export const metadata: Metadata = {
  title: rechtliches.impressum.title,
  description: rechtliches.impressum.intro,
  alternates: { canonical: "/impressum" },
  robots: { index: true, follow: true },
};

export default function Impressum() {
  return <LegalPage content={rechtliches.impressum} titleId="impressum-title" />;
}
