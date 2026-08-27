import type { MetadataRoute } from "next";
import { meta } from "@/content/de";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: `${meta.domain}/sitemap.xml`,
    host: meta.domain,
  };
}
