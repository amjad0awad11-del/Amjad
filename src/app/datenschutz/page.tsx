import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { rechtliches } from "@/content/de";

export const metadata: Metadata = {
  title: rechtliches.datenschutz.title,
  description: rechtliches.datenschutz.intro,
  alternates: { canonical: "/datenschutz" },
  robots: { index: true, follow: true },
};

export default function Datenschutz() {
  return <LegalPage content={rechtliches.datenschutz} titleId="datenschutz-title" />;
}
