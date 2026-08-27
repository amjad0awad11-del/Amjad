import type { MetadataRoute } from "next";
import { meta } from "@/content/de";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: meta.domain, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${meta.domain}/impressum`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${meta.domain}/datenschutz`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
