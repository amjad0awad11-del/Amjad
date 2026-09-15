import type { MetadataRoute } from "next";
import { SITE_URL } from "@/content/cafe";

/**
 * Three routes, so this stays a hand-kept list rather than a crawl.
 *
 * The legal pages are intentionally omitted: while they still contain `[[…]]`
 * placeholders they are marked `noindex`, and listing a noindex URL in the
 * sitemap sends search engines contradictory signals. Add them here once the
 * real legal text is in and the `robots` override in those pages is removed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
