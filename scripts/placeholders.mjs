/**
 * Generates branded placeholder assets so the site builds and renders with
 * nothing missing. Every file it writes is a stand-in — replace them with the
 * real material before launch. Run with: npm run placeholders
 *
 * Videos are deliberately NOT faked: components mount a <video> only when the
 * real file exists in public/media (see src/lib/assets.ts), so a missing clip
 * degrades to its poster instead of producing a 404.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const INK = "#0B0B0D";
const CREAM = "#F4F0E8";
const AMBER = "#EFB03C";

const ROOT = path.resolve(import.meta.dirname, "..");
const MEDIA = path.join(ROOT, "public", "media");
const IMAGES = path.join(ROOT, "public", "images");

const written = [];

/** Branded placeholder: ink ground, amber frame, AMW monogram, file name. */
function placeholderSvg(width, height, name, note) {
  const short = Math.min(width, height);
  const pad = Math.round(short * 0.06);
  const mark = Math.round(short * 0.11);
  const label = Math.max(11, Math.round(short * 0.028));
  const cx = width / 2;
  const cy = height / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${INK}"/>
  <rect x="${pad}" y="${pad}" width="${width - pad * 2}" height="${height - pad * 2}"
        fill="none" stroke="${AMBER}" stroke-opacity="0.28" stroke-width="1"/>
  <circle cx="${cx}" cy="${cy - mark * 0.35}" r="${mark * 2.4}" fill="${AMBER}" fill-opacity="0.06"/>
  <text x="${cx}" y="${cy}" text-anchor="middle" font-family="sans-serif"
        font-size="${mark}" font-weight="700" letter-spacing="${mark * 0.08}"
        fill="${CREAM}">AMW</text>
  <text x="${cx}" y="${cy + label * 2.4}" text-anchor="middle" font-family="monospace"
        font-size="${label}" fill="${AMBER}" fill-opacity="0.85">${name}</text>
  <text x="${cx}" y="${cy + label * 4.1}" text-anchor="middle" font-family="monospace"
        font-size="${label * 0.85}" fill="${CREAM}" fill-opacity="0.45">${width}×${height}${note ? ` · ${note}` : ""}</text>
  <text x="${cx}" y="${height - pad - label * 0.4}" text-anchor="middle" font-family="monospace"
        font-size="${label * 0.8}" fill="${CREAM}" fill-opacity="0.3">PLATZHALTER — ERSETZEN</text>
</svg>`;
}

async function writeImage(dir, file, width, height, note) {
  const target = path.join(dir, file);
  if (existsSync(target) && !process.argv.includes("--force")) {
    console.log(`  skip (exists)  ${path.relative(ROOT, target)}`);
    return;
  }
  const svg = Buffer.from(placeholderSvg(width, height, file, note));
  const pipeline = sharp(svg, { density: 144 }).resize(width, height, { fit: "cover" });
  const buffer = file.endsWith(".png")
    ? await pipeline.png({ compressionLevel: 9 }).toBuffer()
    : await pipeline.jpeg({ quality: 78, mozjpeg: true }).toBuffer();
  await writeFile(target, buffer);
  written.push(path.relative(ROOT, target));
  console.log(`  wrote          ${path.relative(ROOT, target)}`);
}

/** 128×128 tiling monochrome grain for the A31 overlay. */
async function writeNoise() {
  const target = path.join(IMAGES, "noise.png");
  if (existsSync(target) && !process.argv.includes("--force")) {
    console.log(`  skip (exists)  ${path.relative(ROOT, target)}`);
    return;
  }
  const size = 128;
  const pixels = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i += 1) {
    const value = 96 + Math.floor(Math.random() * 128);
    pixels[i * 4] = value;
    pixels[i * 4 + 1] = value;
    pixels[i * 4 + 2] = value;
    pixels[i * 4 + 3] = 255;
  }
  const buffer = await sharp(pixels, { raw: { width: size, height: size, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(target, buffer);
  written.push(path.relative(ROOT, target));
  console.log(`  wrote          ${path.relative(ROOT, target)}`);
}

async function main() {
  await mkdir(MEDIA, { recursive: true });
  await mkdir(IMAGES, { recursive: true });

  console.log("\nAMW · Platzhalter-Assets\n");

  await writeImage(MEDIA, "hero-poster.jpg", 1920, 1080, "Hero");
  for (let i = 1; i <= 6; i += 1) {
    await writeImage(IMAGES, `work-${i}.jpg`, 1080, 1920, "Arbeiten 9:16");
  }
  for (let i = 1; i <= 5; i += 1) {
    await writeImage(IMAGES, `leistung-${i}.jpg`, 600, 338, "Hover-Vorschau");
  }
  for (let i = 1; i <= 4; i += 1) {
    await writeImage(IMAGES, `studio-${i}.jpg`, 1200, 900, "Studio");
  }
  await writeImage(IMAGES, "og.jpg", 1200, 630, "Open Graph");
  await writeNoise();

  console.log(`\n${written.length} Datei(en) geschrieben.`);
  console.log("\nNoch offen — echte Videos hier ablegen:");
  const videos = [
    "public/media/hero.mp4",
    ...Array.from({ length: 6 }, (_, i) => `public/media/work-${i + 1}.mp4`),
    ...Array.from({ length: 5 }, (_, i) => `public/media/leistung-${i + 1}.mp4`),
  ];
  for (const video of videos) {
    console.log(`  ${existsSync(path.join(ROOT, video)) ? "vorhanden" : "fehlt    "}  ${video}`);
  }
  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
