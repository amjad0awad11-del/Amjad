import type { MetadataRoute } from "next";
import { SITE_URL } from "@/content/cafe";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Next.js image optimizer URLs are not content; keeping crawlers out of
        // them avoids duplicate-asset noise in the index.
        disallow: ["/_next/image"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
