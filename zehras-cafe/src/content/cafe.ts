/**
 * ============================================================================
 * ZEHRA'S BAGUETTE & CAFÉ — zentrale Inhaltsdatei
 * ============================================================================
 *
 * This is the ONLY file the café needs to edit for day-to-day content changes:
 * texts, menu categories, opening hours, phone number, social links, gallery
 * images, review excerpts and SEO data all live here. No visible customer-facing
 * string is hard-coded in a component.
 *
 * ----------------------------------------------------------------------------
 * DATA HONESTY RULES BAKED INTO THIS FILE
 * ----------------------------------------------------------------------------
 * 1. Anything confirmed from the Google Maps listing supplied in the brief is
 *    marked `// BESTÄTIGT`.
 * 2. Anything that could NOT be confirmed is `null` / `[]` and marked
 *    `// PLATZHALTER`. The UI *hides* those parts instead of inventing values,
 *    so the site is publishable today and gets richer as facts are confirmed.
 * 3. Never replace a `null` with a guess. Prices, opening hours, phone numbers,
 *    ratings and reviews are either real or absent.
 *
 * Every open point is also listed in `pendingConfirmation` at the bottom, which
 * is what the README's pre-launch checklist refers to.
 */

/* ========================================================================== */
/* GRUNDDATEN                                                                 */
/* ========================================================================== */

/**
 * Public base URL of the finished site. Used for canonical links, Open Graph
 * and JSON-LD `url`.
 *
 * PLATZHALTER: no website was confirmed for the café, so no domain is invented
 * here. Set NEXT_PUBLIC_SITE_URL in the hosting environment (e.g.
 * `NEXT_PUBLIC_SITE_URL=https://www.ihre-domain.de`) before going live.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

/**
 * The Google Maps listing supplied as the source of truth. Used for the
 * "Route planen" buttons and the "Weitere Bewertungen auf Google ansehen" CTA.
 * BESTÄTIGT — this exact URL comes from the brief.
 */
export const GOOGLE_MAPS_LISTING =
  "https://www.google.de/maps/place/Zehra%E2%80%98s+Baguette+%26+Cafe/@51.4507446,6.6181351,16z/data=!4m10!1m2!2m1!1sMoers+coffe!3m6!1s0x47b8bdb3729f1479:0xa99a3962eb64e15a!8m2!3d51.4507881!4d6.6275451!15sCgxNb2VycyBjb2ZmZWVaDiIMbW9lcnMgY29mZmVlkgEKcmVzdGF1cmFudJoBRENpOURRVWxSUVVOdlpFTm9kSGxqUmpsdlQyNU9TbVF6U25Ka1JVcFVaVWR6ZWxSdVVqSlNiSEJTVFZST1JFMHpZeEFC4AEA-gEECAAQNg!16s%2Fg%2F11ntf2h7t2?hl=de";

export const business = {
  /** BESTÄTIGT — exact listing name. */
  name: "Zehra’s Baguette & Café",
  /** Short form for tight spots (mobile header, footer wordmark line breaks). */
  shortName: "Zehra’s Baguette & Café",
  /** BESTÄTIGT — Café / frisch belegte Baguettes, Kuchen, Getränke. */
  category: "Café in Moers",
  /** Brand promise from the brief. */
  claim: "Frisch belegt. Hausgemacht. Mit Liebe serviert.",

  address: {
    // BESTÄTIGT — Oberwallstraße 55, 47441 Moers, Deutschland
    street: "Oberwallstraße 55",
    postalCode: "47441",
    city: "Moers",
    country: "Deutschland",
    countryCode: "DE",
    /** One-line form used on the hero address card. */
    inline: "Oberwallstraße 55 · 47441 Moers",
  },

  /** BESTÄTIGT — coordinates taken from the supplied Google Maps listing URL. */
  geo: {
    latitude: 51.4507881,
    longitude: 6.6275451,
  },

  /**
   * PLATZHALTER — no telephone number could be confirmed from the listing.
   * To activate the phone row + tel: link, replace null with:
   *   phone: { display: "02841 000000", dial: "+492841000000" }
   * `dial` must be E.164 (no spaces, leading +).
   */
  phone: null as { display: string; dial: string } | null,

  /**
   * PLATZHALTER — no e-mail address was confirmed.
   * Example once known: email: "hallo@ihre-domain.de"
   */
  email: null as string | null,

  /**
   * PLATZHALTER — no official café website was confirmed on the listing.
   * Leave null if this site becomes the official website.
   */
  externalWebsite: null as string | null,
} as const;

/* ========================================================================== */
/* ÖFFNUNGSZEITEN                                                             */
/* ========================================================================== */

export type OpeningHour = {
  /** German label shown to guests. */
  day: string;
  /** schema.org DayOfWeek value, used for JSON-LD only. */
  schemaDay:
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday";
  /** "08:00" — 24h, or null when closed. */
  opens: string | null;
  /** "18:00" — 24h, or null when closed. */
  closes: string | null;
};

/**
 * PLATZHALTER — the opening hours could not be confirmed, so NOTHING is shown
 * and no `openingHoursSpecification` is emitted in the structured data. Wrong
 * hours cost real guests, so the section stays hidden until these are real.
 *
 * To activate, fill the array exactly like this (closed days: opens/closes null):
 *
 *   export const openingHours: OpeningHour[] = [
 *     { day: "Montag",     schemaDay: "Monday",    opens: "07:30", closes: "18:00" },
 *     { day: "Dienstag",   schemaDay: "Tuesday",   opens: "07:30", closes: "18:00" },
 *     { day: "Mittwoch",   schemaDay: "Wednesday", opens: "07:30", closes: "18:00" },
 *     { day: "Donnerstag", schemaDay: "Thursday",  opens: "07:30", closes: "18:00" },
 *     { day: "Freitag",    schemaDay: "Friday",    opens: "07:30", closes: "18:00" },
 *     { day: "Samstag",    schemaDay: "Saturday",  opens: "08:00", closes: "16:00" },
 *     { day: "Sonntag",    schemaDay: "Sunday",    opens: null,    closes: null   },
 *   ];
 */
export const openingHours: OpeningHour[] = [];

/**
 * Shown in place of the hours table while `openingHours` is still empty, so the
 * visit section never looks broken or unfinished.
 */
export const openingHoursFallback = {
  title: "Öffnungszeiten",
  text: "Die aktuellen Öffnungszeiten finden Sie jederzeit tagesaktuell in unserem Google-Eintrag.",
  linkLabel: "Öffnungszeiten bei Google ansehen",
};

/* ========================================================================== */
/* NAVIGATION                                                                 */
/* ========================================================================== */

export type NavItem = { label: string; href: string };

export const nav: NavItem[] = [
  { label: "Startseite", href: "#start" },
  { label: "Unsere Auswahl", href: "#auswahl" },
  { label: "Über uns", href: "#ueber-uns" },
  { label: "Impressionen", href: "#impressionen" },
  { label: "Besuch uns", href: "#besuch" },
];

/** Primary call to action, repeated in header, hero, visit section and footer. */
export const routeCta = {
  label: "Route planen",
  /**
   * Per the brief this opens the supplied Google Maps listing in a new tab.
   * If you would rather send guests straight into turn-by-turn navigation,
   * swap in:
   *   href: "https://www.google.com/maps/dir/?api=1&destination=Oberwallstra%C3%9Fe+55%2C+47441+Moers"
   */
  href: GOOGLE_MAPS_LISTING,
  /** Screen-reader hint: makes the new-tab behaviour explicit. */
  ariaLabel: "Route zu Zehra’s Baguette & Café planen — öffnet Google Maps in einem neuen Tab",
};

/* ========================================================================== */
/* HERO                                                                        */
/* ========================================================================== */

export const hero = {
  eyebrow: "Moers · frisch für Sie gemacht",
  /** Rendered line by line for the editorial serif setting. */
  headlineLines: ["Frisch belegt.", "Hausgemacht.", "Mit Liebe serviert."],
  /** Same sentence as one string — used for the document title and aria labels. */
  headlinePlain: "Frisch belegt. Hausgemacht. Mit Liebe serviert.",
  support:
    "Baguettes, hausgemachte Kuchen, Matcha und Kaffeemomente – mitten in Moers.",
  secondaryCta: { label: "Unsere Auswahl entdecken", href: "#auswahl" },
  addressCardLabel: "Sie finden uns hier",
  /** Hint shown under the hero while the 3D opening is still available. */
  scrollHint: "Scrollen Sie weiter",
} as const;

/**
 * The single supplied video asset. Do not add further videos — the brief allows
 * exactly this one clip, played inside the hero's café-display card.
 */
export const heroVideo = {
  src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663941589753/vTqSXAzrhLDJHcrm.mp4",
  /**
   * Poster/first frame. Currently a designed brand still (see
   * `npm run assets`) because the video host is not reachable from the build
   * environment. Replace public/images/hero-poster.jpg with a real frame of the
   * clip — same 1920×1080 dimensions, nothing else changes.
   */
  poster: "/images/hero-poster.jpg",
  ariaLabel:
    "3D-Animation eines frisch belegten Baguettes mit Kaffee und hausgemachtem Kuchen",
  /** Shown to screen readers and if the file cannot be decoded at all. */
  fallbackText:
    "Kurze 3D-Animation: ein frisch belegtes Baguette, ein Latte Macchiato und ein Stück hausgemachter Kuchen in warmem Café-Licht.",
} as const;

/* ========================================================================== */
/* ABSCHNITT: CAFÉ-EINLEITUNG                                                 */
/* ========================================================================== */

export const intro = {
  eyebrow: "Willkommen",
  heading: "Ein Café für echte Genussmomente.",
  paragraphs: [
    "Mitten in Moers, an der Oberwallstraße, nehmen wir uns Zeit für das, was frisch auf den Teller kommt: knusprige Baguettes, die erst belegt werden, wenn Sie vor der Theke stehen. Kuchen, die bei uns selbst entstehen. Und einen Kaffee, der in Ruhe getrunken werden darf.",
    "Ob schnell auf die Hand oder ganz gemütlich am Tisch – bei uns ist beides richtig. Kommen Sie vorbei, wie Sie sind.",
  ],
  /** Small, factual highlights — each one is covered by the confirmed offer. */
  highlights: [
    "Frisch belegt, erst auf Ihre Bestellung",
    "Kuchen und Käsekuchen aus eigener Herstellung",
    "Kaffee, Matcha und kalte Getränke",
  ],
  image: {
    src: "/images/cafe-atmosphaere.jpg",
    alt: "Warm beleuchteter Gastraum von Zehra’s Baguette & Café mit Holztischen und Tageslicht",
    width: 1400,
    height: 1750,
  },
} as const;

/* ========================================================================== */
/* ABSCHNITT: UNSERE AUSWAHL                                                  */
/* ========================================================================== */

/** Icon keys map to Lucide icons in src/components/sections/Auswahl.tsx. */
export type MenuIcon = "baguette" | "kuchen" | "salat" | "kaffee";

export type MenuCard = {
  id: string;
  title: string;
  text: string;
  icon: MenuIcon;
  image: { src: string; alt: string; width: number; height: number };
};

export const auswahl = {
  eyebrow: "Unsere Auswahl",
  heading: "Was Sie bei uns erwartet.",
  intro:
    "Alles, was Sie hier sehen, machen wir frisch. Die genaue Tagesauswahl finden Sie an unserer Theke – Preise und Tagesangebote erfahren Sie direkt bei uns im Café.",
  /**
   * BESTÄTIGT — the four categories come from the confirmed offer list
   * (frisch belegte Baguettes · hausgemachte Torten und Käsekuchen · frische
   * Salate · Latte Macchiato, Cappuccino, Matcha, warme und kalte Getränke).
   * Deliberately NO prices: none were confirmed.
   */
  cards: [
    {
      id: "baguettes",
      title: "Frisch belegte Baguettes",
      text: "Knusprig, frisch belegt und mit viel Liebe zubereitet.",
      icon: "baguette",
      image: {
        src: "/images/auswahl-baguettes.jpg",
        alt: "Frisch belegtes Baguette mit knuspriger Kruste auf einem Holzbrett",
        width: 1200,
        height: 900,
      },
    },
    {
      id: "kuchen",
      title: "Hausgemachte Kuchen",
      text: "Von cremigem Käsekuchen bis zu süßen Lieblingsstücken für Ihre Pause.",
      icon: "kuchen",
      image: {
        src: "/images/auswahl-kuchen.jpg",
        alt: "Stück hausgemachter Käsekuchen auf einem Keramikteller",
        width: 1200,
        height: 900,
      },
    },
    {
      id: "salate",
      title: "Frische Salate",
      text: "Leicht, frisch und genau richtig für zwischendurch.",
      icon: "salat",
      image: {
        src: "/images/auswahl-salate.jpg",
        alt: "Frischer gemischter Salat in einer Schale mit knackigem Gemüse",
        width: 1200,
        height: 900,
      },
    },
    {
      id: "getraenke",
      title: "Kaffee, Matcha & Drinks",
      text: "Vom Latte Macchiato bis zum erfrischenden Matcha – warm oder kalt.",
      icon: "kaffee",
      image: {
        src: "/images/auswahl-getraenke.jpg",
        alt: "Latte Macchiato im Glas neben einem Matcha Latte auf einer Café-Theke",
        width: 1200,
        height: 900,
      },
    },
  ] satisfies MenuCard[],
  /** Honest note instead of invented prices. */
  priceNote:
    "Preise und die aktuelle Tagesauswahl finden Sie vor Ort im Café.",
} as const;

/* ========================================================================== */
/* ABSCHNITT: ÜBER UNS                                                        */
/* ========================================================================== */

export const ueberUns = {
  eyebrow: "Über uns",
  heading: "Mit Liebe für Moers gemacht.",
  /**
   * Deliberately free of invented biography, founding dates, family history or
   * awards. Every sentence is covered by the confirmed offer and location.
   */
  paragraphs: [
    "Zehra’s Baguette & Café ist ein kleines, persönlich geführtes Café in Moers. Kein Konzept von der Stange, sondern ein Ort, an dem frisch belegte Baguettes, hausgemachte Torten und ein guter Kaffee selbstverständlich sind.",
    "Wir machen die Dinge gern selbst: Unsere Kuchen und unser Käsekuchen entstehen in unserer eigenen Küche, unsere Baguettes werden frisch für Sie belegt, unsere Salate frisch zubereitet. Was einfach klingt, ist genau das, worauf wir Wert legen.",
    "Und weil wir mitten in Moers zu Hause sind, freuen wir uns über jeden Gast aus der Nachbarschaft – über die, die uns längst kennen, und über die, die uns heute zum ersten Mal entdecken.",
  ],
  /** Short, factual value props. No superlatives, no unverifiable claims. */
  values: [
    {
      title: "Frisch zubereitet",
      text: "Belegt und angerichtet wird erst, wenn Sie bestellen.",
    },
    {
      title: "Hausgemacht",
      text: "Torten und Käsekuchen kommen aus unserer eigenen Küche.",
    },
    {
      title: "Mitten in Moers",
      text: "Oberwallstraße 55 – zentral und schnell erreichbar.",
    },
  ],
  image: {
    src: "/images/ueber-uns-theke.jpg",
    alt: "Blick über die Theke von Zehra’s Baguette & Café mit Kuchenauslage",
    width: 1400,
    height: 1050,
  },
} as const;

/* ========================================================================== */
/* ABSCHNITT: IMPRESSIONEN (GALERIE)                                          */
/* ========================================================================== */

export type GalleryImage = {
  id: string;
  src: string;
  alt: string;
  /** Optional caption shown in the lightbox. */
  caption?: string;
  width: number;
  height: number;
  /** Editorial grid emphasis: "wide" spans two columns on larger screens. */
  span?: "wide" | "tall";
};

export const impressionen = {
  eyebrow: "Impressionen",
  heading: "Ein Blick in unser Café.",
  intro:
    "Ein paar Eindrücke von unseren Baguettes, unserem Kuchen und dem Café an der Oberwallstraße.",
  /**
   * PLATZHALTER-BILDER. Google Maps guest photos, map tiles, Street View and
   * review avatars are deliberately NOT used — they are not licensed for reuse
   * on your own website. `npm run assets` generates branded stand-ins at the
   * exact dimensions below, so the layout is final and swapping in real photos
   * changes nothing but the pixels. Keep the alt texts (or improve them) — they
   * are read aloud by screen readers.
   */
  images: [
    {
      id: "baguette-theke",
      src: "/images/galerie-baguette-01.jpg",
      alt: "Frisch belegtes Baguette mit Salat und Käse, aufgeschnitten auf einem Brett",
      caption: "Frisch belegt, erst auf Ihre Bestellung.",
      width: 1600,
      height: 1200,
      span: "wide",
    },
    {
      id: "kaesekuchen",
      src: "/images/galerie-kuchen-01.jpg",
      alt: "Hausgemachter Käsekuchen mit cremiger Füllung auf einer Kuchenplatte",
      caption: "Käsekuchen aus eigener Herstellung.",
      width: 1200,
      height: 1500,
    },
    {
      id: "latte-macchiato",
      src: "/images/galerie-kaffee-01.jpg",
      alt: "Latte Macchiato im Glas mit feiner Milchschaumschicht",
      caption: "Latte Macchiato, in Ruhe getrunken.",
      width: 1200,
      height: 1200,
    },
    {
      id: "matcha",
      src: "/images/galerie-matcha-01.jpg",
      alt: "Matcha Latte in einer Keramiktasse auf einem Holztisch",
      caption: "Matcha – warm oder kalt.",
      width: 1200,
      height: 1500,
    },
    {
      id: "torten",
      src: "/images/galerie-kuchen-02.jpg",
      alt: "Auswahl hausgemachter Torten in der Kuchenauslage des Cafés",
      caption: "Süße Lieblingsstücke für Ihre Pause.",
      width: 1600,
      height: 1200,
      span: "wide",
    },
    {
      id: "theke",
      src: "/images/galerie-theke-01.jpg",
      alt: "Theke von Zehra’s Baguette & Café mit frischen Zutaten und Kuchenauslage",
      caption: "Unsere Theke an der Oberwallstraße.",
      width: 1200,
      height: 1200,
    },
    {
      id: "innenraum",
      src: "/images/galerie-innenraum-01.jpg",
      alt: "Gemütlicher Innenraum des Cafés mit Sitzplätzen in warmem Licht",
      caption: "Platz nehmen und bleiben.",
      width: 1200,
      height: 1500,
    },
    {
      id: "aussenansicht",
      src: "/images/galerie-aussen-01.jpg",
      alt: "Außenansicht von Zehra’s Baguette & Café an der Oberwallstraße 55 in Moers",
      caption: "Oberwallstraße 55, mitten in Moers.",
      width: 1600,
      height: 1200,
      span: "wide",
    },
  ] satisfies GalleryImage[],
  lightbox: {
    openLabel: "Bild vergrößern",
    closeLabel: "Schließen",
    prevLabel: "Vorheriges Bild",
    nextLabel: "Nächstes Bild",
    /** e.g. "Bild 3 von 8" */
    counter: (current: number, total: number) => `Bild ${current} von ${total}`,
    regionLabel: "Bildergalerie – Vollbildansicht",
  },
} as const;

/* ========================================================================== */
/* ABSCHNITT: GÄSTESTIMMEN                                                    */
/* ========================================================================== */

export type ReviewExcerpt = {
  /** Short verbatim excerpt from a REAL Google review. Never invent these. */
  quote: string;
  /** Always "Google-Bewertung" — no names, no avatars, no personal photos. */
  source: string;
};

/**
 * PLATZHALTER — the Google Maps listing could not be opened from the build
 * environment (blocked by the network policy), so neither the star rating, the
 * review count nor any review text is available. Nothing is invented and the
 * whole "Das sagen unsere Gäste" section is hidden while this stays empty.
 *
 * To activate it, fill in ONLY values you have actually read on the listing:
 *
 *   rating: 4.8,
 *   reviewCount: 143,
 *   excerpts: [
 *     { quote: "Die Baguettes sind immer frisch und richtig lecker.", source: "Google-Bewertung" },
 *   ]
 *
 * Rules that must hold: 3–5 short excerpts, verbatim, no author names, no
 * avatars, no profile pictures. The section renders as soon as `excerpts` has
 * at least one entry; the rating badge appears only when BOTH `rating` and
 * `reviewCount` are set.
 */
export const gaestestimmen = {
  eyebrow: "Gästestimmen",
  heading: "Das sagen unsere Gäste.",
  rating: null as number | null,
  reviewCount: null as number | null,
  excerpts: [] as ReviewExcerpt[],
  /** Always available, even while the excerpts are still empty. */
  cta: {
    label: "Weitere Bewertungen auf Google ansehen",
    href: GOOGLE_MAPS_LISTING,
  },
  ratingLabel: (rating: number, count: number) =>
    `${rating.toLocaleString("de-DE", { minimumFractionDigits: 1 })} von 5 Sternen bei ${count.toLocaleString("de-DE")} Google-Bewertungen`,
};

/* ========================================================================== */
/* ABSCHNITT: BESUCH UNS                                                      */
/* ========================================================================== */

export const besuch = {
  eyebrow: "Besuch uns",
  heading: "Besuchen Sie uns in Moers.",
  intro:
    "Sie finden uns an der Oberwallstraße 55, mitten in Moers. Kommen Sie gern spontan vorbei – wir freuen uns auf Sie.",
  addressLabel: "Adresse",
  phoneLabel: "Telefon",
  /** Shown instead of a phone row while `business.phone` is still null. */
  phoneFallback:
    "Eine Telefonnummer hinterlegen wir hier, sobald sie bestätigt ist.",
  mapCta: {
    label: "Route planen",
    href: GOOGLE_MAPS_LISTING,
  },
  reviewsCta: {
    label: "Weitere Bewertungen auf Google ansehen",
    href: GOOGLE_MAPS_LISTING,
  },
  /**
   * Abstract, branded location card. Deliberately NOT a Google map tile, not a
   * Google Maps screenshot and not Street View — those need a licensed Maps API
   * setup plus attribution.
   */
  locationCard: {
    district: "Moers-Mitte",
    label: "Oberwallstraße 55",
    note: "Zentrale Lage in der Moerser Innenstadt.",
  },
} as const;

/* ========================================================================== */
/* ABSCHNITT: SOCIAL MEDIA                                                    */
/* ========================================================================== */

export type SocialLink = {
  platform: "instagram" | "facebook" | "tiktok";
  label: string;
  href: string;
};

/**
 * PLATZHALTER — no social-media profile could be confirmed from the listing.
 * Add a verified profile like this and the section starts rendering links:
 *
 *   { platform: "instagram", label: "@zehras.baguette.cafe", href: "https://www.instagram.com/…" }
 *
 * Posts are intentionally NOT embedded or scraped — an embed needs the café's
 * own approval and a supported integration.
 */
export const socialLinks: SocialLink[] = [];

export const social = {
  eyebrow: "Social Media",
  heading: "Einblicke aus unserer Küche.",
  text: "Folgen Sie uns für frische Ideen, neue Kuchen und Genussmomente aus Moers.",
  /** Shown while `socialLinks` is empty, so the section still makes sense. */
  fallbackText:
    "Unsere Social-Media-Kanäle verlinken wir hier, sobald sie bestätigt sind. Bis dahin finden Sie uns jederzeit über unseren Google-Eintrag.",
  fallbackCta: {
    label: "Zum Google-Eintrag",
    href: GOOGLE_MAPS_LISTING,
  },
} as const;

/* ========================================================================== */
/* FOOTER & RECHTLICHES                                                       */
/* ========================================================================== */

export const footer = {
  tagline: "Frisch belegt. Hausgemacht. Mit Liebe serviert.",
  legalLinks: [
    { label: "Impressum", href: "/impressum" },
    { label: "Datenschutz", href: "/datenschutz" },
  ],
  /** Rendered as "© 2026 Zehra’s Baguette & Café" with the year computed live. */
  copyrightHolder: "Zehra’s Baguette & Café",
  credit: null as string | null,
} as const;

/**
 * PLATZHALTER — Impressum and Datenschutz are legally required in Germany and
 * must be completed by the café (or its legal advisor) before launch. The pages
 * exist, are linked and are indexable-safe, but every [[…]] marker below has to
 * be replaced with real data.
 */
export const legal = {
  impressum: {
    title: "Impressum",
    intro: "Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz).",
    blocks: [
      {
        heading: "Anbieter",
        lines: [
          "[[VOLLSTÄNDIGER FIRMENNAME / INHABER]]",
          "Oberwallstraße 55",
          "47441 Moers",
          "Deutschland",
        ],
      },
      {
        heading: "Vertreten durch",
        lines: ["[[VOR- UND NACHNAME DER INHABERIN / DES INHABERS]]"],
      },
      {
        heading: "Kontakt",
        lines: ["Telefon: [[TELEFONNUMMER]]", "E-Mail: [[E-MAIL-ADRESSE]]"],
      },
      {
        heading: "Umsatzsteuer-Identifikationsnummer",
        lines: ["[[USt-IdNr. GEMÄSS § 27 a UStG — falls vorhanden]]"],
      },
      {
        heading: "Verantwortlich für den Inhalt",
        lines: [
          "[[VOR- UND NACHNAME]]",
          "Oberwallstraße 55, 47441 Moers",
        ],
      },
      {
        heading: "Streitschlichtung",
        lines: [
          "Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen. [[Bitte rechtlich prüfen lassen.]]",
        ],
      },
    ],
    note: "Dieser Text ist ein Platzhalter und noch keine vollständige Rechtsauskunft. Bitte vor der Veröffentlichung juristisch prüfen lassen.",
  },
  datenschutz: {
    title: "Datenschutzerklärung",
    intro:
      "Wir freuen uns über Ihren Besuch auf unserer Website. Der Schutz Ihrer personenbezogenen Daten ist uns wichtig.",
    blocks: [
      {
        heading: "Verantwortliche Stelle",
        lines: [
          "[[VOLLSTÄNDIGER FIRMENNAME / INHABER]]",
          "Oberwallstraße 55, 47441 Moers",
          "E-Mail: [[E-MAIL-ADRESSE]]",
        ],
      },
      {
        heading: "Hosting und Server-Logfiles",
        lines: [
          "Beim Aufruf dieser Website werden durch den Hosting-Anbieter technisch notwendige Daten verarbeitet (z. B. IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seite, übertragene Datenmenge, Browsertyp). Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.",
          "Hosting-Anbieter: [[NAME UND ADRESSE DES HOSTING-ANBIETERS]]",
        ],
      },
      {
        heading: "Externe Inhalte",
        lines: [
          "Diese Website bindet keine Karten, Schriftarten oder Social-Media-Inhalte von Dritten nach. Schriftarten werden lokal ausgeliefert, Karteninhalte werden nicht eingebettet.",
          "Die Schaltflächen „Route planen“ und „Weitere Bewertungen auf Google ansehen“ sind einfache Links. Erst wenn Sie sie anklicken, werden Sie zu Google Maps weitergeleitet und es gelten die Datenschutzbestimmungen von Google.",
          "Das Video im Kopfbereich wird von [[HOSTING-ANBIETER DES VIDEOS]] geladen. Dabei wird Ihre IP-Adresse an diesen Anbieter übermittelt. [[Bitte prüfen und gegebenenfalls das Video lokal ausliefern.]]",
        ],
      },
      {
        heading: "Cookies und Analyse",
        lines: [
          "Diese Website setzt keine Cookies zu Analyse- oder Marketingzwecken und verwendet keine Tracking-Dienste. [[Bitte anpassen, falls später Analyse-Werkzeuge ergänzt werden.]]",
        ],
      },
      {
        heading: "Ihre Rechte",
        lines: [
          "Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Wenden Sie sich dazu an die oben genannte verantwortliche Stelle. Ihnen steht außerdem ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu.",
        ],
      },
    ],
    note: "Dieser Text ist ein Platzhalter und noch keine vollständige Rechtsauskunft. Bitte vor der Veröffentlichung juristisch prüfen lassen.",
  },
} as const;

/* ========================================================================== */
/* SEO                                                                        */
/* ========================================================================== */

export const seo = {
  /** 59 characters — fits Google's German desktop title width. */
  title: "Zehra’s Baguette & Café Moers | Frisch belegt & hausgemacht",
  titleTemplate: "%s | Zehra’s Baguette & Café Moers",
  description:
    "Frisch belegte Baguettes, hausgemachte Torten und Käsekuchen, frische Salate, Latte Macchiato und Matcha – mitten in Moers an der Oberwallstraße 55. Kommen Sie vorbei.",
  locale: "de_DE",
  lang: "de",
  /**
   * `keywords` carries almost no ranking weight today; the real local-SEO work
   * is the German copy, the headings, the address and the JSON-LD below. Kept
   * short and honest.
   */
  keywords: [
    "Café Moers",
    "Baguette Moers",
    "Frühstück Moers",
    "hausgemachter Kuchen Moers",
    "Käsekuchen Moers",
    "Kaffee Moers",
    "Matcha Moers",
    "Zehra’s Baguette & Café",
  ],
  /**
   * Open Graph image. `npm run assets` generates a branded 1200×630 card at
   * this path; replace it with a real photo of the café or the food whenever one
   * is available (same path, same dimensions — nothing else to change).
   */
  ogImage: {
    src: "/images/og.jpg",
    width: 1200,
    height: 630,
    alt: "Zehra’s Baguette & Café in Moers – frisch belegte Baguettes, hausgemachter Kuchen und Kaffee",
  },
  /** Warm cream — matches the page background so mobile browser chrome blends in. */
  themeColor: "#FBF6EC",
} as const;

/* ========================================================================== */
/* OFFENE PUNKTE VOR DEM LIVEGANG                                             */
/* ========================================================================== */

export type PendingItem = {
  key: string;
  label: string;
  /** What the site does while this is unconfirmed. */
  behaviourUntilConfirmed: string;
};

/**
 * Single source of truth for the README's pre-launch checklist. Everything here
 * is unconfirmed on purpose — the site is fully usable without it.
 */
export const pendingConfirmation: PendingItem[] = [
  {
    key: "domain",
    label: "Domain der Website (NEXT_PUBLIC_SITE_URL)",
    behaviourUntilConfirmed:
      "Canonical, Open Graph und JSON-LD nutzen http://localhost:3000. Vor dem Livegang setzen.",
  },
  {
    key: "opening-hours",
    label: "Öffnungszeiten",
    behaviourUntilConfirmed:
      "Statt einer Zeitentabelle erscheint ein Hinweis auf den Google-Eintrag. Keine openingHoursSpecification im JSON-LD.",
  },
  {
    key: "phone",
    label: "Telefonnummer",
    behaviourUntilConfirmed:
      "Die Telefonzeile wird ausgeblendet, kein telephone im JSON-LD.",
  },
  {
    key: "reviews",
    label: "Google-Bewertung, Anzahl der Bewertungen und Zitate",
    behaviourUntilConfirmed:
      "Der gesamte Abschnitt „Das sagen unsere Gäste“ wird nicht gerendert. Kein aggregateRating im JSON-LD.",
  },
  {
    key: "social",
    label: "Instagram- und weitere Social-Media-Profile",
    behaviourUntilConfirmed:
      "Der Social-Abschnitt zeigt einen Hinweis und verlinkt den Google-Eintrag statt einzelner Profile.",
  },
  {
    key: "photos",
    label: "Echte Café-, Speisen- und Außenfotos",
    behaviourUntilConfirmed:
      "Es werden gebrandete Platzhalter in den endgültigen Bildmaßen ausgeliefert. Google-Nutzerfotos, Kartenkacheln und Street View werden bewusst nicht verwendet.",
  },
  {
    key: "hero-poster",
    label: "Poster-Bild des Hero-Videos",
    behaviourUntilConfirmed:
      "Ein gestaltetes Marken-Standbild dient als Poster. Ideal ist ein echtes Standbild aus dem Video.",
  },
  {
    key: "video-hosting",
    label: "Hosting des Hero-Videos",
    behaviourUntilConfirmed:
      "Das Video wird vom gelieferten externen Link geladen. Für Datenschutz und Ladezeit sollte es auf die eigene Domain umgezogen werden.",
  },
  {
    key: "legal",
    label: "Impressum und Datenschutzerklärung",
    behaviourUntilConfirmed:
      "Beide Seiten existieren mit klar markierten [[…]]-Platzhaltern und müssen juristisch geprüft werden.",
  },
  {
    key: "breakfast",
    label: "Frühstücksangebot",
    behaviourUntilConfirmed:
      "„Frühstück Moers“ steht nur in den SEO-Keywords. Im sichtbaren Text wird kein Frühstück versprochen, solange es nicht bestätigt ist.",
  },
  {
    key: "amenities",
    label: "Ausstattung und Services (Sitzplätze außen, Barrierefreiheit, Zahlungsarten)",
    behaviourUntilConfirmed:
      "Es werden keine Angaben gemacht. Bestätigte Angaben können im Abschnitt „Besuch uns“ ergänzt werden.",
  },
];
