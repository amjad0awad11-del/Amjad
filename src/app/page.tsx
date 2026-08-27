import { Shell } from "@/components/layout/Shell";

export default function Home() {
  return (
    <Shell>
      <section data-theme="dark" id="hero" className="section-y">
        <div className="wrap">
          <h1 className="t-display">AMW</h1>
        </div>
      </section>
      <section data-theme="light" id="leistungen" className="section-y">
        <div className="wrap">
          <h2 className="t-h2">Leistungen</h2>
        </div>
      </section>
      <section data-theme="amber" id="preise" className="section-y">
        <div className="wrap">
          <h2 className="t-h2">Preise</h2>
        </div>
      </section>
      <section data-theme="dark" id="kontakt" className="section-y">
        <div className="wrap">
          <h2 className="t-h2">Kontakt</h2>
        </div>
      </section>
    </Shell>
  );
}
