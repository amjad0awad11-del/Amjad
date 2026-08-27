import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Server-side check for a file in /public.
 *
 * Video placeholders are deliberately not generated (see scripts/placeholders.mjs),
 * so sections ask this before mounting a <video>: a missing clip degrades to its
 * poster image instead of firing a 404. Dropping the real file into public/media
 * lights the video up with no code change.
 *
 * Server components only — it touches the filesystem.
 */
export function hasAsset(publicPath: string): boolean {
  if (!publicPath.startsWith("/")) return false;
  const target = path.join(process.cwd(), "public", publicPath.slice(1));
  return existsSync(target);
}
