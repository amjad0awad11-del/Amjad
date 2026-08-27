/**
 * AMW — sämtliche Website-Texte.
 *
 * Regel: In JSX steht kein einziger sichtbarer String. Alles kommt von hier.
 * Platzhalter im Format [[NAME]] bleiben sichtbar stehen, bis der Kunde echte
 * Werte liefert — es werden keine Preise, Namen, Zitate oder Zahlen erfunden.
 */

export type NavLink = { label: string; href: string };

/** Digits only, with country code — wa.me rejects "+" and spaces. */
export const WHATSAPP_NUMBER = "4915562753949";

/**
 * Opens WhatsApp straight into a chat with AMW, first message pre-filled so the
 * visitor only has to hit send.
 */
export const WHATSAPP_CTA = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hallo AMW, ich habe eure Website gesehen und interessiere mich für Meta Ads."
)}`;
export type Fact = { value: string; label: string };

export const meta = {
  siteName: "AMW",
  domain: "https://amwagence.de",
  title: "AMW — Creative Performance Studio für Beauty & Fragrance",
  description:
    "AMW entwickelt Video- und Bild-Creatives, UGC und Ads-Management für Beauty-, Skincare- und Fragrance-Marken auf Meta. Ohne Setup-Gebühr, ohne Mindestlaufzeit, monatlich kündbar.",
  locale: "de_DE",
  lang: "de",
  ogImageAlt: "AMW — Creative Performance Studio für Meta Ads",
  email: "info@amwagence.de",
  whatsapp: "https://wa.me/4915562753949",
  instagram: "[[INSTAGRAM_URL]]",
  calendly: "[[CALENDLY_URL]]",
  serviceTypes: [
    "Meta Ads für Beauty-Marken",
    "Video Creatives",
    "Static Creatives",
    "UGC-Content",
    "Ads Management",
    "Creative Strategy",
  ],
  areaServed: ["DE", "AT", "CH"],
} as const;

export const a11y = {
  skipLink: "Zum Inhalt springen",
  mainLabel: "Hauptinhalt",
  menuOpen: "Menü öffnen",
  menuClose: "Menü schließen",
  menuLabel: "Hauptnavigation",
  progressLabel: "Lesefortschritt",
  sliderRoleDescription: "Karussell",
  sliderPrev: "Vorherige Stimme",
  sliderNext: "Nächste Stimme",
  sliderGoTo: "Zu Stimme",
  closeLightbox: "Showreel schließen",
  lightboxLabel: "Showreel",
  playHint: "Video abspielen",
  decorative: "",
} as const;

export const preloader = {
  wordmark: "AMW",
  subline: "Beauty · Skincare · Fragrance",
  counterLabel: "Ladefortschritt",
} as const;

export const header = {
  wordmark: "AMW",
  homeLabel: "AMW — zur Startseite",
  nav: [
    { label: "Leistungen", href: "#leistungen" },
    { label: "Arbeiten", href: "#arbeiten" },
    { label: "Prozess", href: "#prozess" },
    { label: "Preise", href: "#preise" },
    { label: "Kontakt", href: "#kontakt" },
  ] as NavLink[],
  cta: { label: "Erstgespräch buchen", href: WHATSAPP_CTA } as NavLink,
  localeLabel: "DE",
} as const;

export const menu = {
  title: "Navigation",
  links: [
    { label: "Leistungen", href: "#leistungen" },
    { label: "Arbeiten", href: "#arbeiten" },
    { label: "Prozess", href: "#prozess" },
    { label: "Preise", href: "#preise" },
    { label: "FAQ", href: "#faq" },
    { label: "Kontakt", href: "#kontakt" },
  ] as NavLink[],
  metaTitle: "Direkt",
  meta: [
    { label: "WhatsApp", href: "https://wa.me/4915562753949" },
    { label: "info@amwagence.de", href: "mailto:info@amwagence.de" },
    { label: "Instagram", href: "[[INSTAGRAM_URL]]" },
    { label: "Impressum", href: "/impressum" },
  ] as NavLink[],
} as const;

export const hero = {
  id: "hero",
  eyebrow: "AMW — Creative Performance Studio · Beauty & Fragrance",
  h1: ["Creatives, die verkaufen.", "Nicht nur gefallen."],
  sub: "Wir entwickeln Video- und Bild-Creatives für Beauty-, Skincare- und Fragrance-Marken auf Meta — vom ersten Hook bis zum Kauf.",
  ctaPrimary: { label: "Per WhatsApp schreiben", href: WHATSAPP_CTA } as NavLink,
  ctaSecondary: { label: "Showreel ansehen", href: "#showreel" } as NavLink,
  badges: ["Keine Setup-Gebühr", "Keine Mindestlaufzeit", "Monatlich kündbar"],
  scrollCue: "Scrollen",
  /** The hero wall plays the same creatives shown in the work gallery. */
  wall: [
    "/media/work-1.mp4",
    "/media/work-2.mp4",
    "/media/work-3.mp4",
    "/media/work-4.mp4",
    "/media/work-5.mp4",
    "/media/work-6.mp4",
  ],
  wallAlt: "Ausschnitte aus AMW-Creatives für Meta Ads",
  poster: "/media/hero-poster.jpg",
} as const;

export const showreel = {
  src: "/media/work-1.mp4",
  poster: "/media/hero-poster.jpg",
  title: "AMW Showreel",
  caption: "Ausschnitt aus laufenden Kampagnen.",
} as const;

export const ticker = {
  items: [
    "Beauty",
    "Skincare",
    "Fragrance",
    "Video Creatives",
    "UGC",
    "Meta Ads",
    "Creative Strategy",
  ],
  separator: "✦",
} as const;

export const manifest = {
  id: "haltung",
  label: "01 — Haltung",
  lead: "Ein Creative ist kein Kunstwerk. Es ist eine Behauptung — und die wird im Ad-Konto bewiesen.",
  body: "Schöne Produktbilder hat in dieser Kategorie jeder. Was fehlt, ist der Grund, warum jemand stehenbleibt: die Textur in Großaufnahme, der Moment vor dem Spiegel, das Versprechen in drei Sekunden. Daraus entstehen Winkel, aus Winkeln Varianten, aus Varianten Zahlen. Was funktioniert, wird ausgebaut. Was nicht funktioniert, wird abgeschaltet.",
  claim: "Eine Kategorie. Ein Kanal.",
  claimBody:
    "Wir arbeiten nur mit Beauty, Skincare und Fragrance — und nur auf Meta. Zwei Entscheidungen, die jede dritte davon überflüssig machen.",
  facts: [
    { value: "0 €", label: "Setup-Gebühr" },
    { value: "2–4", label: "Wochen bis zu ersten Signalen" },
    { value: "30–90", label: "Tage bis zu stabilen Ergebnissen" },
  ] as Fact[],
} as const;

export const leistungen = {
  id: "leistungen",
  label: "02 — Leistungen",
  title: "Alles, was eine Beauty-Anzeige braucht. Aus einer Hand.",
  items: [
    {
      no: "01",
      title: "Video Ads für Meta",
      text: "Hook, Textur, Angebot — in dieser Reihenfolge. Vertikale Videos, die in den ersten drei Sekunden gewinnen: Close-ups, die die Konsistenz zeigen, Anwendung statt Aufzählung, Untertitel für den Feed ohne Ton.",
      tags: ["9:16", "4:5", "Untertitel", "Hook-Varianten"],
      preview: "/media/leistung-1.mp4",
      previewAlt: "Vorschau: vertikales Video-Creative für Meta Ads",
    },
    {
      no: "02",
      title: "Statics & Bilder",
      text: "Produktshots, Vorher/Nachher, Inhaltsstoff-Grafiken, Claim-Statics. Aus einem Produktfoto werden zwanzig testbare Varianten — jede mit eigener Botschaft.",
      tags: ["1:1", "4:5", "Carousel", "Vorher/Nachher"],
      preview: "/media/leistung-2.mp4",
      previewAlt: "Vorschau: statische Bild-Creatives in mehreren Formaten",
    },
    {
      no: "03",
      title: "UGC & KI-Creatives",
      text: "Creator-Optik ohne Casting-Chaos: Badezimmerspiegel, Morgenroutine, ehrliche erste Reaktion. KI-generierte UGC-Videos in Studioqualität, auf Deutsch vertont, in Tagen statt Wochen.",
      tags: ["UGC", "KI-Video", "Voice-over DE"],
      preview: "/media/leistung-3.mp4",
      previewAlt: "Vorschau: UGC-Video im Creator-Look",
    },
    {
      no: "04",
      title: "Ads Management",
      text: "Kampagnenstruktur, Testing-Framework, Tracking-Setup und tägliche Steuerung. Sauber aufgesetzt, transparent berichtet.",
      tags: ["Setup", "Testing", "Tracking", "Skalierung"],
      preview: "/media/leistung-4.mp4",
      previewAlt: "Vorschau: Kampagnenstruktur im Meta-Werbeanzeigenmanager",
    },
    {
      no: "05",
      title: "Creative Strategy",
      text: "Verkauft das Produkt über Ritual, Inhaltsstoff oder Ergebnis? Wir schreiben die Hypothesen, bevor die Kamera läuft — und leiten daraus den Creative-Plan für den Monat ab.",
      tags: ["Angle Research", "Claims", "Creative-Plan"],
      preview: "/media/leistung-5.mp4",
      previewAlt: "Vorschau: Creative-Plan mit Winkeln und Hypothesen",
    },
  ],
} as const;

export const arbeiten = {
  id: "arbeiten",
  label: "03 — Arbeiten",
  title: "Ausgewählte Creatives.",
  note: "Ausschnitt aus laufenden Beauty- und Fragrance-Kampagnen. Weitere Beispiele im Erstgespräch.",
  cursorLabel: "Ansehen",
  dragHint: "Ziehen",
  items: [
    {
      client: "[[KUNDE_1]]",
      category: "Beauty",
      type: "Video Ad",
      year: "2026",
      media: "/media/work-1.mp4",
      kind: "video" as const,
      alt: "Creative-Beispiel: vertikales Video-Ad aus einer Beauty-Kampagne",
    },
    {
      client: "[[KUNDE_2]]",
      category: "Skincare",
      type: "Video Ad",
      year: "2026",
      media: "/media/work-2.mp4",
      kind: "video" as const,
      alt: "Creative-Beispiel: vertikales Video-Ad aus einer Skincare-Kampagne",
    },
    {
      client: "[[KUNDE_3]]",
      category: "Fragrance",
      type: "Video Ad",
      year: "2026",
      media: "/media/work-3.mp4",
      kind: "video" as const,
      alt: "Creative-Beispiel: vertikales Video-Ad aus einer Duft-Kampagne",
    },
    {
      client: "[[KUNDE_4]]",
      category: "UGC",
      type: "UGC-Video",
      year: "2026",
      media: "/media/work-4.mp4",
      kind: "video" as const,
      alt: "Creative-Beispiel: UGC-Video im Creator-Look",
    },
    {
      client: "[[KUNDE_5]]",
      category: "Beauty",
      type: "Video Ad",
      year: "2026",
      media: "/media/work-5.mp4",
      kind: "video" as const,
      alt: "Creative-Beispiel: vertikales Video-Ad aus einer Beauty-Kampagne",
    },
    {
      client: "[[KUNDE_6]]",
      category: "Skincare",
      type: "UGC-Video",
      year: "2026",
      media: "/media/work-6.mp4",
      kind: "video" as const,
      alt: "Creative-Beispiel: UGC-Video aus einer Skincare-Kampagne",
    },
    {
      client: "[[KUNDE_7]]",
      category: "Fragrance",
      type: "UGC-Video",
      year: "2026",
      media: "/media/work-7.mp4",
      kind: "video" as const,
      alt: "Creative-Beispiel: UGC-Video aus einer Duft-Kampagne",
    },
    {
      client: "[[KUNDE_8]]",
      category: "Beauty",
      type: "Video Ad",
      year: "2026",
      media: "/media/work-8.mp4",
      kind: "video" as const,
      alt: "Creative-Beispiel: vertikales Video-Ad aus einer Beauty-Kampagne",
    },
  ],
} as const;

export const prozess = {
  id: "prozess",
  label: "04 — Prozess",
  title: "Vier Schritte. Kein Blindflug.",
  steps: [
    {
      no: "01",
      title: "Analyse & Strategie",
      text: "Wir schauen ins Konto, ins Produkt und ins Regal daneben: Was verkauft heute, welcher Winkel wurde nie getestet, was behaupten die anderen? Ergebnis ist ein Creative-Plan mit klaren Hypothesen.",
    },
    {
      no: "02",
      title: "Kreation & Setup",
      text: "Skripte, Produktion, Schnitt, Statics — Textur, Licht und Ton so, wie die Kategorie es verlangt. Parallel dazu: Kampagnenstruktur, Tracking und Naming sauber aufgesetzt.",
    },
    {
      no: "03",
      title: "Launch & Testing",
      text: "Wir starten mit Winkeln statt Bauchgefühl. Jede Woche neue Varianten, klare Testlogik, keine Kampagnen-Friedhöfe.",
    },
    {
      no: "04",
      title: "Skalierung",
      text: "Gewinner ausbauen, Verlierer abschalten, Frequenz und Creative-Fatigue im Blick behalten — in Beauty ist ein Creative schneller verbraucht als anderswo. Monatliches Reporting in Klartext.",
    },
  ],
} as const;

export const vergleich = {
  id: "vergleich",
  label: "05 — Vergleich",
  title: "Warum AMW und nicht die anderen?",
  criterionLabel: "Kriterium",
  columns: ["AMW", "Klassische Agentur", "Freelancer"],
  rows: [
    {
      label: "Fokus",
      amw: "Nur Beauty, nur Meta — dafür voll ausgereizt",
      agency: "Jede Branche, jeder Kanal",
      freelancer: "Hängt an einer Person",
    },
    {
      label: "Creatives",
      amw: "Video, Static und UGC inhouse — für diese Kategorie gebaut",
      agency: "Produktion oft extern",
      freelancer: "Meist nur ein Format",
    },
    {
      label: "Geschwindigkeit",
      amw: "Neue Varianten wöchentlich",
      agency: "Freigabeschleifen über Wochen",
      freelancer: "Nach Verfügbarkeit",
    },
    {
      label: "Vertrag",
      amw: "Monatlich kündbar",
      agency: "6–12 Monate Bindung",
      freelancer: "Projektbasiert",
    },
    {
      label: "Setup-Gebühr",
      amw: "0 €",
      agency: "Üblich",
      freelancer: "Selten",
    },
    {
      label: "Kategorie-Wissen",
      amw: "Claims, Texturen, Rituale — täglich im Konto",
      agency: "Wird pro Kunde neu gelernt",
      freelancer: "Hängt am Portfolio",
    },
    {
      label: "Reporting",
      amw: "Klartext, monatlich",
      agency: "Dashboard-Wüste",
      freelancer: "Auf Nachfrage",
    },
  ],
} as const;

export const preise = {
  id: "preise",
  label: "06 — Pakete",
  title: "Klare Pakete. Keine Knebelverträge.",
  featuredLabel: "Beliebteste Wahl",
  plans: [
    {
      name: "CREATIVE",
      tagline: "Nur Creatives — du schaltest selbst.",
      price: "[[PREIS_CREATIVE]]",
      period: "pro Monat",
      features: [
        "[[ANZAHL]] Creatives pro Monat (Video + Static)",
        "2 Konzeptrunden",
        "Alle Formate: 9:16, 4:5, 1:1",
        "Untertitel & Varianten",
        "Feedback innerhalb von 48 Stunden",
      ],
      cta: "Paket anfragen",
      featured: false,
      badge: null,
    },
    {
      name: "PERFORMANCE",
      tagline: "Creatives plus vollständiges Ads-Management.",
      price: "[[PREIS_PERFORMANCE]]",
      period: "pro Monat",
      features: [
        "Alles aus CREATIVE",
        "Kampagnenstruktur & Testing-Framework",
        "Tracking-Setup und Prüfung",
        "Wöchentliche Optimierung",
        "Monatliches Reporting im Klartext",
      ],
      cta: "Erstgespräch buchen",
      featured: true,
      badge: "Beliebteste Wahl",
    },
    {
      name: "SCALE",
      tagline: "Für Shops ab [[UMSATZGRENZE]] Monatsumsatz.",
      price: "[[PREIS_SCALE]]",
      period: "pro Monat",
      features: [
        "Alles aus PERFORMANCE",
        "Höhere Creative-Frequenz",
        "Wöchentlicher Strategie-Call",
        "Angebots- und Funnel-Beratung",
        "Priorisierter Support",
      ],
      cta: "Verfügbarkeit prüfen",
      featured: false,
      badge: null,
    },
  ],
  note: "Alle Pakete ohne Setup-Gebühr und ohne Mindestlaufzeit, monatlich kündbar. Preise zzgl. USt. Werbebudget nicht enthalten.",
} as const;

export const stimmen = {
  id: "stimmen",
  label: "07 — Stimmen",
  title: "Was Kundinnen und Kunden sagen.",
  items: [
    {
      quote: "[[TESTIMONIAL_1_ZITAT]]",
      name: "[[TESTIMONIAL_1_NAME]]",
      role: "[[TESTIMONIAL_1_ROLLE]]",
    },
    {
      quote: "[[TESTIMONIAL_2_ZITAT]]",
      name: "[[TESTIMONIAL_2_NAME]]",
      role: "[[TESTIMONIAL_2_ROLLE]]",
    },
    {
      quote: "[[TESTIMONIAL_3_ZITAT]]",
      name: "[[TESTIMONIAL_3_NAME]]",
      role: "[[TESTIMONIAL_3_ROLLE]]",
    },
  ],
} as const;

export const studio = {
  id: "studio",
  label: "08 — Studio",
  title: "Klein, schnell, spezialisiert.",
  body: "AMW ist ein kompaktes Team aus Strategie, Kreation und Media-Buying — und wir arbeiten ausschließlich mit Beauty-, Skincare- und Fragrance-Marken. Kein Account-Management-Turm, keine Weiterreichung: Die Leute, die deine Ads bauen, sitzen auch in der Auswertung. Wenige Kunden gleichzeitig, weil Testing Aufmerksamkeit braucht, keine Kapazitätsplanung.",
  values: [
    {
      title: "Schön reicht nicht",
      text: "Ästhetik bringt dich in den Feed. Bewiesen wird im Ad-Konto.",
    },
    {
      title: "Tempo vor Perfektion",
      text: "Lieber zehn getestete Varianten als ein perfekter Spot.",
    },
    {
      title: "Klartext vor Buzzwords",
      text: "Reporting, das du in fünf Minuten verstehst.",
    },
  ],
  stats: [
    { value: "[[STAT_1_WERT]]", label: "[[STAT_1_LABEL]]" },
    { value: "[[STAT_2_WERT]]", label: "[[STAT_2_LABEL]]" },
    { value: "[[STAT_3_WERT]]", label: "[[STAT_3_LABEL]]" },
  ] as Fact[],
  grid: [
    { src: "/images/studio-1.jpg", alt: "Blick ins Studio: Setup für einen Produktdreh", parallax: 0.08 },
    { src: "/images/studio-2.jpg", alt: "Schnittplatz mit Creative-Varianten in der Übersicht", parallax: 0.16 },
    { src: "/images/studio-3.jpg", alt: "Storyboard mit Hook-Varianten an der Wand", parallax: 0.12 },
    { src: "/images/studio-4.jpg", alt: "Auswertung einer laufenden Meta-Kampagne am Bildschirm", parallax: 0.08 },
  ],
} as const;

export const faq = {
  id: "faq",
  label: "09 — FAQ",
  title: "Häufige Fragen.",
  items: [
    {
      q: "Was kostet die Zusammenarbeit?",
      a: "Das hängt von Umfang und Creative-Frequenz ab. Die Pakete starten bei [[PREIS_CREATIVE]] pro Monat, das Werbebudget kommt separat dazu. Im Erstgespräch bekommst du eine konkrete Zahl statt einer Spanne.",
    },
    {
      q: "Gibt es eine Mindestlaufzeit?",
      a: "Nein. Keine Setup-Gebühr, keine Mindestlaufzeit, monatlich kündbar. Wir wollen bleiben, weil die Zahlen stimmen — nicht wegen eines Vertrags.",
    },
    {
      q: "Wie schnell sehe ich Ergebnisse?",
      a: "Erste Signale zeigen sich meist nach 2 bis 4 Wochen, stabile Ergebnisse nach 30 bis 90 Tagen. Vorher testen wir systematisch, statt Budget zu verbrennen.",
    },
    {
      q: "Brauche ich eigenes Video- oder Bildmaterial?",
      a: "Nein. Wir arbeiten mit deinen Produktfotos, produzieren KI-UGC oder organisieren echten Content. Vorhandenes Kampagnenmaterial nutzen wir natürlich mit.",
    },
    {
      q: "Wem gehören die Creatives?",
      a: "Dir. Nach Bezahlung gehen alle Nutzungsrechte an den Creatives an dich über.",
    },
    {
      q: "Arbeitet ihr nur mit Beauty-Marken?",
      a: "Unser Fokus liegt auf Beauty, Skincare und Fragrance — dort kennen wir die Claims, die Texturen und die Regeln. Passt dein Produkt nicht ganz in diese Kategorie, sag trotzdem Bescheid: Wenn wir die richtige Adresse sind, sagen wir es. Wenn nicht, auch.",
    },
    {
      q: "Arbeitet ihr auch mit TikTok oder Google?",
      a: "Unser Fokus liegt auf Meta. Die Creatives lassen sich auf anderen Plattformen ausspielen, das Kampagnenmanagement bleibt bei Meta.",
    },
    {
      q: "Ab welchem Werbebudget lohnt sich das?",
      a: "[[MIN_BUDGET_ANTWORT]]",
    },
    {
      q: "Wie läuft das Onboarding ab?",
      a: "Erstgespräch, Zugriffe und Tracking-Check, Creative-Plan, Launch — in der Regel innerhalb von zehn Tagen.",
    },
  ],
} as const;

export const kontakt = {
  id: "kontakt",
  label: "10 — Kontakt",
  title: "Lass uns über deine Ads reden.",
  sub: "Fünfzehn Minuten reichen, um zu sehen, ob wir zueinander passen. Kein Pitch-Deck, kein Verkaufsgespräch.",
  form: {
    name: "Name",
    email: "E-Mail",
    website: "Website oder Shop-URL",
    budget: {
      label: "Monatliches Werbebudget",
      placeholder: "Bitte auswählen",
      options: ["unter 3.000 €", "3.000–10.000 €", "10.000–30.000 €", "über 30.000 €"],
    },
    message: "Worum geht's?",
    consent:
      "Ich habe die Datenschutzerklärung gelesen und stimme der Verarbeitung meiner Daten zu.",
    consentLinkLabel: "Datenschutzerklärung",
    consentLinkHref: "/datenschutz",
    submit: "Anfrage senden",
    sending: "Wird gesendet",
    sent: "Gesendet",
    success: "Danke! Wir melden uns innerhalb von 24 Stunden.",
    error: "Da ist etwas schiefgelaufen. Schreib uns gern direkt per WhatsApp.",
    required: "Pflichtfeld",
    optional: "optional",
    honeypotLabel: "Dieses Feld bitte frei lassen",
    errors: {
      name: "Bitte trag deinen Namen ein.",
      email: "Bitte trag eine gültige E-Mail-Adresse ein.",
      message: "Schreib uns kurz, worum es geht.",
      consent: "Ohne deine Zustimmung dürfen wir die Anfrage nicht verarbeiten.",
    },
  },
  directTitle: "Direkt",
  direct: [
    { label: "WhatsApp", value: "Direkt schreiben", href: WHATSAPP_CTA },
    { label: "E-Mail", value: "info@amwagence.de", href: "mailto:info@amwagence.de" },
    { label: "Termin", value: "Erstgespräch buchen", href: "[[CALENDLY_URL]]" },
  ],
} as const;

export const footer = {
  wordmark: "AMW",
  tagline: "Creative Performance Studio · Beauty & Fragrance",
  navTitle: "Seite",
  nav: [
    { label: "Leistungen", href: "#leistungen" },
    { label: "Arbeiten", href: "#arbeiten" },
    { label: "Prozess", href: "#prozess" },
    { label: "Preise", href: "#preise" },
    { label: "FAQ", href: "#faq" },
    { label: "Kontakt", href: "#kontakt" },
  ] as NavLink[],
  legalTitle: "Rechtliches",
  legal: [
    { label: "Impressum", href: "/impressum" },
    { label: "Datenschutz", href: "/datenschutz" },
  ] as NavLink[],
  socialTitle: "Social",
  social: [
    { label: "Instagram", href: "[[INSTAGRAM_URL]]" },
    { label: "WhatsApp", href: WHATSAPP_CTA },
  ] as NavLink[],
  clockLabel: "Berlin",
  copyright: "© 2026 AMW. Alle Rechte vorbehalten.",
  backToTop: "Nach oben",
} as const;

export const rechtliches = {
  impressum: {
    title: "Impressum",
    label: "Rechtliches",
    intro: "Angaben gemäß § 5 DDG.",
    content: "[[IMPRESSUM_INHALT]]",
    hint: "Dieser Abschnitt wird durch die rechtsverbindlichen Angaben ersetzt.",
    back: "Zurück zur Startseite",
  },
  datenschutz: {
    title: "Datenschutz",
    label: "Rechtliches",
    intro: "Informationen zur Verarbeitung personenbezogener Daten.",
    content: "[[DATENSCHUTZ_INHALT]]",
    hint: "Dieser Abschnitt wird durch die rechtsverbindliche Datenschutzerklärung ersetzt.",
    back: "Zurück zur Startseite",
  },
} as const;

export const notFound = {
  code: "404",
  title: "Diese Seite gibt es nicht.",
  body: "Der Link ist tot oder die Seite ist umgezogen. Zurück zur Startseite — dort steht alles Wichtige.",
  cta: { label: "Zur Startseite", href: "/" } as NavLink,
} as const;

/** Section index shown next to the scroll-progress line (A30). */
export const sectionIndex: { id: string; label: string }[] = [
  { id: "hero", label: "Start" },
  { id: "haltung", label: "Haltung" },
  { id: "leistungen", label: "Leistungen" },
  { id: "arbeiten", label: "Arbeiten" },
  { id: "prozess", label: "Prozess" },
  { id: "vergleich", label: "Vergleich" },
  { id: "preise", label: "Preise" },
  { id: "stimmen", label: "Stimmen" },
  { id: "studio", label: "Studio" },
  { id: "faq", label: "FAQ" },
  { id: "kontakt", label: "Kontakt" },
];
