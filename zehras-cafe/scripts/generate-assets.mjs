/**
 * Generates the branded placeholder imagery so the site builds, renders and
 * measures correctly before the café's real photos exist.
 *
 *   npm run assets          # writes only what is missing
 *   npm run assets:force    # regenerates everything
 *
 * Every file it writes is a STAND-IN at the exact final dimensions, so dropping
 * a real photo in its place changes the pixels and nothing else — no layout
 * shift, no code change, no re-measuring.
 *
 * Google Maps guest photos, Maps screenshots, map tiles, Street View imagery
 * and reviewer avatars are deliberately NOT used as sources here: none of them
 * are licensed for reuse on the café's own website.
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const IMAGES = path.join(ROOT, "public", "images");
const CONTENT = path.join(ROOT, "src", "content", "cafe.ts");
const FORCE = process.argv.includes("--force");

/* -------------------------------------------------------------------------- */
/* Brand palette — kept in sync with src/app/globals.css                       */
/* -------------------------------------------------------------------------- */
const C = {
  cream: "#FBF6EC",
  linen: "#F4EADB",
  ceramic: "#FFFCF7",
  espresso: "#3A2A20",
  charcoal: "#221A15",
  caramel: "#C8863C",
  caramelDeep: "#8F5A23",
  sage: "#8FA382",
  sageDeep: "#5A6B4E",
  muted: "#6B5344",
  onDark: "#F6EEE1",
};

// librsvg (which sharp renders SVG through) resolves against system fonts, so
// these are chosen from what is actually installed rather than the web fonts.
const SERIF = "Liberation Serif, DejaVu Serif, serif";
const SANS = "Liberation Sans, DejaVu Sans, sans-serif";

const escapeXml = (value) =>
  value.replace(/[<>&'"]/g, (char) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[char],
  );

/* -------------------------------------------------------------------------- */
/* Placeholder art                                                             */
/* -------------------------------------------------------------------------- */

/**
 * A warm, deliberately designed stand-in: soft tonal ground, an abstract
 * arrangement of shapes in the brand palette, the subject named in the
 * editorial serif, and an unmistakable "replace me" marker.
 */
function placeholderSvg({ width, height, subject, file, tone }) {
  const short = Math.min(width, height);
  const cx = width / 2;
  const cy = height / 2;

  const scheme =
    tone === "sage"
      ? { from: C.linen, to: "#E7E3D2", shape: C.sage, ink: C.espresso }
      : tone === "dark"
        ? { from: "#2A2018", to: C.charcoal, shape: C.caramel, ink: C.onDark }
        : { from: C.ceramic, to: C.linen, shape: C.caramel, ink: C.espresso };

  const titleSize = Math.max(19, Math.round(short * 0.062));
  const metaSize = Math.max(11, Math.round(short * 0.026));
  const pillSize = Math.max(9, Math.round(short * 0.021));
  const subtle = tone === "dark" ? 0.2 : 0.14;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="${scheme.from}"/>
      <stop offset="100%" stop-color="${scheme.to}"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="42%" r="58%">
      <stop offset="0%" stop-color="${scheme.shape}" stop-opacity="${subtle + 0.1}"/>
      <stop offset="100%" stop-color="${scheme.shape}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#g)"/>
  <rect width="${width}" height="${height}" fill="url(#halo)"/>

  <!-- Abstract still life: a long form (baguette), a round form (cup) and a
       wedge (cake). Suggestive, never pretending to be a photograph. -->
  <g opacity="${subtle + 0.08}">
    <rect x="${cx - short * 0.42}" y="${cy - short * 0.3}" width="${short * 0.84}" height="${short * 0.16}"
          rx="${short * 0.08}" fill="${scheme.shape}"/>
    <circle cx="${cx - short * 0.22}" cy="${cy + short * 0.08}" r="${short * 0.13}" fill="${scheme.shape}"/>
    <path d="M ${cx + short * 0.06} ${cy + short * 0.21} L ${cx + short * 0.34} ${cy + short * 0.21} L ${cx + short * 0.2} ${cy - short * 0.04} Z"
          fill="${scheme.shape}"/>
  </g>

  <!-- Hairline frame: the crop the real photo has to fill. -->
  <rect x="${Math.round(short * 0.035)}" y="${Math.round(short * 0.035)}"
        width="${width - Math.round(short * 0.07)}" height="${height - Math.round(short * 0.07)}"
        fill="none" stroke="${scheme.ink}" stroke-opacity="0.16" stroke-width="1"/>

  <text x="${cx}" y="${cy + titleSize * 0.35}" text-anchor="middle"
        font-family="${SERIF}" font-size="${titleSize}" fill="${scheme.ink}">${escapeXml(subject)}</text>

  <text x="${cx}" y="${cy + titleSize * 1.75}" text-anchor="middle"
        font-family="${SANS}" font-size="${metaSize}" fill="${scheme.ink}" fill-opacity="0.6">${width} × ${height}</text>

  <text x="${cx}" y="${height - Math.round(short * 0.085)}" text-anchor="middle"
        font-family="${SANS}" font-size="${pillSize}" letter-spacing="${pillSize * 0.18}"
        fill="${scheme.ink}" fill-opacity="0.55">PLATZHALTER — BITTE ERSETZEN</text>

  <text x="${cx}" y="${height - Math.round(short * 0.045)}" text-anchor="middle"
        font-family="${SANS}" font-size="${pillSize}" fill="${scheme.ink}" fill-opacity="0.38">${escapeXml(file)}</text>
</svg>`;
}

/**
 * The hero poster carries more weight than the rest: it is the first frame the
 * guest sees, it is the LCP candidate while the clip loads, and it is what shows
 * if the video never loads at all. So it gets a composed, dark, cinematic
 * treatment rather than a flat placeholder.
 */
function heroPosterSvg(width, height) {
  const cx = width / 2;
  const cy = height / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="ground" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#3B2C21"/>
      <stop offset="55%" stop-color="#2A2018"/>
      <stop offset="100%" stop-color="#1B1510"/>
    </linearGradient>
    <radialGradient id="lamp" cx="50%" cy="34%" r="52%">
      <stop offset="0%" stop-color="#E8B168" stop-opacity="0.5"/>
      <stop offset="45%" stop-color="#C8863C" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#C8863C" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFCF7" stop-opacity="0.12"/>
      <stop offset="40%" stop-color="#FFFCF7" stop-opacity="0"/>
      <stop offset="100%" stop-color="#FFFCF7" stop-opacity="0.06"/>
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#ground)"/>
  <rect width="${width}" height="${height}" fill="url(#lamp)"/>

  <!-- Counter line -->
  <rect x="0" y="${cy + height * 0.2}" width="${width}" height="${height * 0.3}" fill="#170F0B" opacity="0.55"/>

  <!-- Baguette -->
  <g transform="translate(${cx - width * 0.2}, ${cy + height * 0.03}) rotate(-8)">
    <rect x="${-width * 0.16}" y="${-height * 0.045}" width="${width * 0.32}" height="${height * 0.09}"
          rx="${height * 0.045}" fill="#C88B45"/>
    <rect x="${-width * 0.16}" y="${-height * 0.045}" width="${width * 0.32}" height="${height * 0.038}"
          rx="${height * 0.03}" fill="#DDA968" opacity="0.75"/>
    <g stroke="#8F5A23" stroke-opacity="0.5" stroke-width="${Math.max(2, height * 0.004)}" stroke-linecap="round">
      <path d="M ${-width * 0.1} ${-height * 0.02} l ${width * 0.022} ${height * 0.03}"/>
      <path d="M ${-width * 0.05} ${-height * 0.024} l ${width * 0.022} ${height * 0.03}"/>
      <path d="M ${0} ${-height * 0.024} l ${width * 0.022} ${height * 0.03}"/>
      <path d="M ${width * 0.05} ${-height * 0.02} l ${width * 0.022} ${height * 0.03}"/>
    </g>
    <path d="M ${-width * 0.14} ${height * 0.012} q ${width * 0.07} ${-height * 0.035} ${width * 0.14} 0 q ${width * 0.07} ${height * 0.03} ${width * 0.14} ${-height * 0.005}"
          fill="none" stroke="#8FA382" stroke-width="${Math.max(3, height * 0.008)}" stroke-linecap="round"/>
  </g>

  <!-- Latte macchiato glass -->
  <g transform="translate(${cx + width * 0.13}, ${cy + height * 0.03})">
    <path d="M ${-width * 0.035} ${-height * 0.13} h ${width * 0.07} l ${-width * 0.006} ${height * 0.235}
             q 0 ${height * 0.022} ${-width * 0.014} ${height * 0.022} h ${-width * 0.026}
             q ${-width * 0.014} 0 ${-width * 0.014} ${-height * 0.022} Z"
          fill="#F1E6D4" opacity="0.9"/>
    <rect x="${-width * 0.032}" y="${-height * 0.118}" width="${width * 0.064}" height="${height * 0.05}"
          rx="${width * 0.006}" fill="#FFFCF7" opacity="0.95"/>
    <rect x="${-width * 0.03}" y="${-height * 0.055}" width="${width * 0.06}" height="${height * 0.085}"
          fill="#9A6634" opacity="0.85"/>
  </g>

  <!-- Cheesecake slice -->
  <g transform="translate(${cx - width * 0.01}, ${cy + height * 0.175})">
    <path d="M ${-width * 0.055} 0 L ${width * 0.055} 0 L ${width * 0.03} ${-height * 0.092} L ${-width * 0.03} ${-height * 0.092} Z"
          fill="#F3E3C4"/>
    <path d="M ${-width * 0.055} 0 L ${width * 0.055} 0 L ${width * 0.048} ${-height * 0.022} L ${-width * 0.048} ${-height * 0.022} Z"
          fill="#C9974F"/>
    <path d="M ${-width * 0.03} ${-height * 0.092} L ${width * 0.03} ${-height * 0.092} L ${width * 0.026} ${-height * 0.104} L ${-width * 0.026} ${-height * 0.104} Z"
          fill="#FFFCF7" opacity="0.9"/>
  </g>

  <rect width="${width}" height="${height}" fill="url(#sheen)"/>

  <!-- Wordmark, bottom left -->
  <text x="${width * 0.055}" y="${height * 0.9}" font-family="${SERIF}"
        font-size="${Math.round(height * 0.052)}" fill="#F6EEE1">Zehra’s</text>
  <text x="${width * 0.055}" y="${height * 0.945}" font-family="${SANS}"
        font-size="${Math.round(height * 0.021)}" letter-spacing="${height * 0.0055}"
        fill="#E3A85C">BAGUETTE &amp; CAFÉ</text>

  <text x="${width * 0.945}" y="${height * 0.945}" text-anchor="end" font-family="${SANS}"
        font-size="${Math.round(height * 0.017)}" fill="#F6EEE1" fill-opacity="0.45">PLATZHALTER-POSTER — BITTE ERSETZEN</text>
</svg>`;
}

/** 1200×630 share card. */
function ogSvg(width, height) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="og-bg" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0%" stop-color="${C.ceramic}"/>
      <stop offset="100%" stop-color="${C.linen}"/>
    </linearGradient>
    <radialGradient id="og-halo" cx="82%" cy="24%" r="58%">
      <stop offset="0%" stop-color="${C.caramel}" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="${C.caramel}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#og-bg)"/>
  <rect width="${width}" height="${height}" fill="url(#og-halo)"/>

  <g opacity="0.16">
    <rect x="${width * 0.62}" y="${height * 0.44}" width="${width * 0.3}" height="${height * 0.1}"
          rx="${height * 0.05}" fill="${C.caramel}"/>
    <circle cx="${width * 0.7}" cy="${height * 0.68}" r="${height * 0.085}" fill="${C.caramel}"/>
    <path d="M ${width * 0.8} ${height * 0.76} L ${width * 0.93} ${height * 0.76} L ${width * 0.865} ${height * 0.61} Z"
          fill="${C.sage}"/>
  </g>

  <rect x="0" y="0" width="${width * 0.012}" height="${height}" fill="${C.caramel}"/>

  <text x="${width * 0.07}" y="${height * 0.24}" font-family="${SANS}" font-size="20"
        letter-spacing="4" fill="${C.caramelDeep}">MOERS · OBERWALLSTRASSE 55</text>

  <text x="${width * 0.07}" y="${height * 0.4}" font-family="${SERIF}" font-size="62" fill="${C.espresso}">Zehra’s Baguette &amp; Café</text>

  <text x="${width * 0.07}" y="${height * 0.53}" font-family="${SERIF}" font-size="38" fill="${C.caramelDeep}">Frisch belegt. Hausgemacht.</text>
  <text x="${width * 0.07}" y="${height * 0.62}" font-family="${SERIF}" font-size="38" fill="${C.caramelDeep}">Mit Liebe serviert.</text>

  <text x="${width * 0.07}" y="${height * 0.78}" font-family="${SANS}" font-size="23" fill="${C.muted}">Baguettes · hausgemachte Kuchen · Kaffee &amp; Matcha</text>

  <text x="${width * 0.07}" y="${height * 0.9}" font-family="${SANS}" font-size="16"
        letter-spacing="2" fill="${C.muted}" fill-opacity="0.75">PLATZHALTER — DURCH ECHTES FOTO ERSETZEN</text>
</svg>`;
}

/* -------------------------------------------------------------------------- */
/* Manifest — mirrors the image paths in src/content/cafe.ts                   */
/* -------------------------------------------------------------------------- */
const MANIFEST = [
  { file: "hero-poster.jpg", width: 1920, height: 1080, kind: "poster" },
  { file: "og.jpg", width: 1200, height: 630, kind: "og" },

  { file: "cafe-atmosphaere.jpg", width: 1400, height: 1750, subject: "Café-Atmosphäre", tone: "warm" },
  { file: "ueber-uns-theke.jpg", width: 1400, height: 1050, subject: "Theke & Team", tone: "warm" },

  { file: "auswahl-baguettes.jpg", width: 1200, height: 900, subject: "Frisch belegte Baguettes", tone: "warm" },
  { file: "auswahl-kuchen.jpg", width: 1200, height: 900, subject: "Hausgemachte Kuchen", tone: "warm" },
  { file: "auswahl-salate.jpg", width: 1200, height: 900, subject: "Frische Salate", tone: "sage" },
  { file: "auswahl-getraenke.jpg", width: 1200, height: 900, subject: "Kaffee, Matcha & Drinks", tone: "sage" },

  { file: "galerie-baguette-01.jpg", width: 1600, height: 1200, subject: "Baguette", tone: "warm" },
  { file: "galerie-kuchen-01.jpg", width: 1200, height: 1500, subject: "Käsekuchen", tone: "warm" },
  { file: "galerie-kaffee-01.jpg", width: 1200, height: 1200, subject: "Latte Macchiato", tone: "warm" },
  { file: "galerie-matcha-01.jpg", width: 1200, height: 1500, subject: "Matcha", tone: "sage" },
  { file: "galerie-kuchen-02.jpg", width: 1600, height: 1200, subject: "Torten", tone: "warm" },
  { file: "galerie-theke-01.jpg", width: 1200, height: 1200, subject: "Theke", tone: "warm" },
  { file: "galerie-innenraum-01.jpg", width: 1200, height: 1500, subject: "Innenraum", tone: "warm" },
  { file: "galerie-aussen-01.jpg", width: 1600, height: 1200, subject: "Außenansicht", tone: "sage" },
];

async function render(entry) {
  const target = path.join(IMAGES, entry.file);
  if (existsSync(target) && !FORCE) {
    console.log(`  skip (exists)   ${entry.file}`);
    return false;
  }

  const svg =
    entry.kind === "poster"
      ? heroPosterSvg(entry.width, entry.height)
      : entry.kind === "og"
        ? ogSvg(entry.width, entry.height)
        : placeholderSvg(entry);

  const buffer = await sharp(Buffer.from(svg), { density: 200 })
    .resize(entry.width, entry.height, { fit: "cover" })
    .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toBuffer();

  await writeFile(target, buffer);
  console.log(`  wrote           ${entry.file}  (${entry.width}×${entry.height})`);
  return true;
}

/**
 * Safety net: if someone adds an image to cafe.ts and forgets to add it here,
 * the site would ship a 404. Cross-check instead of trusting memory.
 */
async function auditAgainstContent() {
  const source = await readFile(CONTENT, "utf8");
  const referenced = new Set(
    [...source.matchAll(/["']\/images\/([A-Za-z0-9._-]+)["']/g)].map((m) => m[1]),
  );
  const known = new Set(MANIFEST.map((entry) => entry.file));

  const missing = [...referenced].filter((file) => !known.has(file));
  const unused = [...known].filter((file) => !referenced.has(file));

  if (missing.length > 0) {
    console.log("\n  ⚠ referenced in cafe.ts but not generated here:");
    missing.forEach((file) => console.log(`      ${file}`));
  }
  if (unused.length > 0) {
    console.log("\n  · generated but not referenced in cafe.ts:");
    unused.forEach((file) => console.log(`      ${file}`));
  }
  return missing.length;
}

async function main() {
  await mkdir(IMAGES, { recursive: true });
  console.log(`\nZehra's Baguette & Café — placeholder assets${FORCE ? " (force)" : ""}\n`);

  let written = 0;
  for (const entry of MANIFEST) {
    if (await render(entry)) written += 1;
  }

  const missing = await auditAgainstContent();

  console.log(`\n  ${written} file(s) written, ${MANIFEST.length} total.`);
  console.log("  All of these are stand-ins. Replace them with the café's own");
  console.log("  photography at the same paths and dimensions before launch.\n");

  if (missing > 0) process.exitCode = 1;
}

await main();
