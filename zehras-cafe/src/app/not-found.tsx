import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/layout/Wordmark";
import { routeCta } from "@/content/cafe";

export default function NotFound() {
  return (
    <main className="shell flex min-h-svh flex-col items-center justify-center gap-7 py-20 text-center">
      <Wordmark variant="stacked" />
      <p className="eyebrow">Fehler 404</p>
      <h1 className="max-w-[24ch] text-[length:var(--fs-h2)]">
        Diese Seite haben wir leider nicht im Angebot.
      </h1>
      <p className="lead mx-auto text-center">
        Die Seite, die Sie suchen, gibt es nicht mehr oder hat eine neue Adresse.
        Unsere Auswahl, unsere Impressionen und der Weg zu uns warten aber weiter
        auf Sie.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          href="/"
          size="lg"
          icon={<ArrowLeft size={17} strokeWidth={2.1} aria-hidden="true" />}
        >
          Zur Startseite
        </Button>
        <Button
          href={routeCta.href}
          aria-label={routeCta.ariaLabel}
          variant="secondary"
          size="lg"
          icon={<MapPin size={17} strokeWidth={2.1} aria-hidden="true" />}
        >
          {routeCta.label}
        </Button>
      </div>
      <Link
        href="/impressum"
        className="text-[0.875rem] text-[var(--muted)] underline decoration-[var(--caramel)]/40 underline-offset-4 hover:decoration-[var(--caramel)]"
      >
        Impressum
      </Link>
    </main>
  );
}
