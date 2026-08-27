import type { Metadata } from "next";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/Button";
import { notFound } from "@/content/de";

export const metadata: Metadata = {
  title: notFound.title,
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Shell>
      <section
        data-theme="dark"
        aria-labelledby="notfound-title"
        className="flex min-h-[80dvh] items-center section-y"
      >
        <div className="wrap flex flex-col gap-8">
          <p className="t-display leading-none" style={{ color: "var(--accent)" }}>
            {notFound.code}
          </p>
          <h1 id="notfound-title" className="t-h2 max-w-[18ch]">
            {notFound.title}
          </h1>
          <p className="t-body t-muted">{notFound.body}</p>
          <div>
            <Button label={notFound.cta.label} href={notFound.cta.href} />
          </div>
        </div>
      </section>
    </Shell>
  );
}
