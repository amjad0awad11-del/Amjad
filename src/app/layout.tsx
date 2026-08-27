import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { meta } from "@/content/de";
import "./globals.css";

/**
 * Display + body face, one family, self-hosted.
 *
 * The brief asks for General Sans / Satoshi from Fontshare; that host is blocked
 * by this environment's egress policy, so a variable geometric grotesque with the
 * same role stands in. To swap in the licensed files, drop the woff2 into
 * public/fonts under the same names — nothing else changes.
 */
const amw = localFont({
  src: [
    {
      path: "../../public/fonts/amw-display-var.woff2",
      weight: "200 800",
      style: "normal",
    },
  ],
  variable: "--font-amw",
  display: "swap",
  preload: true,
  fallback: ["General Sans", "Helvetica Neue", "Arial", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  metadataBase: new URL(meta.domain),
  title: {
    default: meta.title,
    template: `%s — ${meta.siteName}`,
  },
  description: meta.description,
  alternates: { canonical: "/" },
  applicationName: meta.siteName,
  authors: [{ name: meta.siteName, url: meta.domain }],
  creator: meta.siteName,
  publisher: meta.siteName,
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    type: "website",
    locale: meta.locale,
    url: meta.domain,
    siteName: meta.siteName,
    title: meta.title,
    description: meta.description,
    images: [
      {
        url: "/images/og.jpg",
        width: 1200,
        height: 630,
        alt: meta.ogImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: meta.title,
    description: meta.description,
    images: ["/images/og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0D",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={meta.lang} className={amw.variable}>
      <body>{children}</body>
    </html>
  );
}
