import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SITE_URL, seo, business } from "@/content/cafe";
import "./globals.css";

/**
 * ---------------------------------------------------------------------------
 * Typography
 * ---------------------------------------------------------------------------
 * Fraunces (editorial serif, display) + Inter (UI sans). Both are OFL-licensed
 * variable fonts, self-hosted from `src/app/fonts` — see the LICENSE files
 * sitting next to the woff2s.
 *
 * Self-hosted rather than `next/font/google` on purpose: nothing is fetched
 * from a Google host at build time or at runtime, which keeps the build
 * reproducible offline and means no third-party font request to disclose in the
 * privacy policy.
 *
 * Only the `latin` subset is loaded. It already covers every character in the
 * German copy — umlauts, ß, the typographic apostrophe in "Zehra’s", the en
 * dash and the middot. The matching `*-latin-ext-*.woff2` files are checked in
 * next to these: swap the path below if the menu ever needs Turkish glyphs
 * (ş, ğ, ı) or other extended Latin characters.
 */
const fraunces = localFont({
  src: "./fonts/fraunces-latin-wght.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-fraunces",
  display: "swap",
  preload: true,
  // Overriding the fallback metrics to a serif the OS already has keeps the
  // swap from shifting the big display headline.
  adjustFontFallback: "Times New Roman",
  fallback: ["Iowan Old Style", "Palatino", "Georgia", "serif"],
});

const inter = localFont({
  src: "./fonts/inter-latin-wght.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-inter",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
  fallback: ["system-ui", "Segoe UI", "Roboto", "Helvetica Neue", "sans-serif"],
});

/**
 * ---------------------------------------------------------------------------
 * Metadata — German local SEO
 * ---------------------------------------------------------------------------
 * `metadataBase` comes from NEXT_PUBLIC_SITE_URL. Until that is set it falls
 * back to localhost, which keeps `next build` deterministic instead of baking
 * in an invented domain.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: seo.title,
    template: seo.titleTemplate,
  },
  description: seo.description,
  keywords: [...seo.keywords],
  applicationName: business.name,
  alternates: { canonical: "/" },
  category: "restaurant",
  // The address is rendered as real text; letting mobile Safari auto-link it
  // would override the styling and the deliberate route CTA.
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    type: "website",
    locale: seo.locale,
    url: SITE_URL,
    siteName: business.name,
    title: seo.title,
    description: seo.description,
    images: [
      {
        url: seo.ogImage.src,
        width: seo.ogImage.width,
        height: seo.ogImage.height,
        alt: seo.ogImage.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: seo.title,
    description: seo.description,
    images: [seo.ogImage.src],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: seo.themeColor,
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  // Never block pinch-zoom — WCAG 2.2 requires the guest be able to magnify.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={seo.lang} className={`${fraunces.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
