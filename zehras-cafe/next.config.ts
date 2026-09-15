import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // This project lives in a subdirectory of a repository that contains an
    // unrelated site with its own lockfile. Without pinning the root, Turbopack
    // walks up, finds the parent lockfile and treats the whole repo as the
    // workspace — which widens module resolution and file watching to files
    // that have nothing to do with this café site.
    root: path.dirname(new URL(import.meta.url).pathname),
  },
  images: {
    // AVIF first, WebP as the broad-support fallback. Next.js negotiates per
    // request via the Accept header and falls back to the original otherwise.
    formats: ["image/avif", "image/webp"],
    // Photos here are art-directed at a handful of widths; trimming the default
    // ladder keeps the generated srcset small. 384/640 cover mobile cards,
    // 828/1200 the editorial spreads, 1920 the wide-desktop atmosphere shots.
    deviceSizes: [384, 640, 828, 1200, 1920],
    imageSizes: [64, 96, 128, 256],
  },
  // The café's own photos will be swapped in as local files under /public, so no
  // remotePatterns are needed. The supplied hero clip is played by a plain
  // <video> element, which is not routed through the image optimizer at all.
  poweredByHeader: false,
};

export default nextConfig;
