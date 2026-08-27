/**
 * Boots the production build and drives it with Chromium to check the things
 * `next build` cannot: console cleanliness, failed requests, horizontal
 * overflow at every breakpoint, and the reduced-motion path.
 *
 * Usage: npm run qa [-- --shots]
 */
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { chromium } from "playwright";

/** This image ships one Chromium build; point Playwright straight at it. */
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const launchOptions = existsSync(CHROME) ? { executablePath: CHROME } : {};

const ROOT = path.resolve(import.meta.dirname, "..");
const PORT = Number(process.env.QA_PORT ?? 4321);
const BASE = `http://127.0.0.1:${PORT}`;
const SHOTS = process.argv.includes("--shots");
const SHOT_DIR = path.join(ROOT, ".qa");

const VIEWPORTS = [
  { name: "360x640", width: 360, height: 640 },
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 },
];

const ROUTES = ["/", "/impressum", "/datenschutz", "/gibt-es-nicht"];

function startServer() {
  return new Promise((resolve, reject) => {
    const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "production" },
    });
    let settled = false;
    const onData = (chunk) => {
      const text = chunk.toString();
      if (!settled && /Ready|started server|Local:/i.test(text)) {
        settled = true;
        resolve(server);
      }
    };
    server.stdout.on("data", onData);
    server.stderr.on("data", onData);
    server.on("error", reject);
    setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(server);
      }
    }, 12000);
  });
}

const problems = [];
const note = (route, viewport, kind, detail) =>
  problems.push({ route, viewport, kind, detail });

/** Console noise we did not cause and cannot act on. */
const IGNORE = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /favicon\.ico/i,
];

async function auditPage(context, route, viewport, { reduced }) {
  const page = await context.newPage();
  const label = `${viewport.name}${reduced ? " (reduced)" : ""}`;

  const expects404 = route === "/gibt-es-nicht";

  page.on("console", (message) => {
    const type = message.type();
    if (type !== "error" && type !== "warning") return;
    const text = message.text();
    if (IGNORE.some((pattern) => pattern.test(text))) return;
    // The 404 route is supposed to 404; its own document request is not a bug.
    if (expects404 && /status of 404/.test(text)) return;
    note(route, label, `console.${type}`, text.slice(0, 220));
  });
  page.on("pageerror", (error) => note(route, label, "pageerror", String(error).slice(0, 220)));
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "";
    if (/ERR_ABORTED/.test(failure)) return;
    note(route, label, "requestfailed", `${request.url()} — ${failure}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && !expects404) {
      note(route, label, `http${response.status()}`, response.url());
    }
  });

  const response = await page.goto(`${BASE}${route}`, {
    waitUntil: "load",
    timeout: 30000,
  });

  const expected = expects404 ? 404 : 200;
  if (response && response.status() !== expected) {
    note(route, label, "status", `expected ${expected}, got ${response.status()}`);
  }

  // Let the preloader finish and entrance timelines settle.
  await page.waitForTimeout(reduced ? 500 : 2600);

  // Walk the whole page so every scroll-triggered reveal has actually fired
  // before we judge what is visible, then return to the top.
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < pageHeight; y += Math.round(viewport.height * 0.7)) {
    await page.evaluate((value) => window.scrollTo(0, value), y);
    await page.waitForTimeout(reduced ? 60 : 130);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);

  const overflow = await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth <= docWidth + 1) return null;
    const offenders = [];
    for (const element of document.querySelectorAll("body *")) {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.right > docWidth + 1 || rect.left < -1) {
        const style = getComputedStyle(element);
        if (style.position === "fixed") continue;
        offenders.push(
          `${element.tagName.toLowerCase()}.${String(element.className).split(" ")[0]} right=${Math.round(rect.right)}`
        );
      }
      if (offenders.length >= 4) break;
    }
    return { scrollWidth: document.documentElement.scrollWidth, docWidth, offenders };
  });

  if (overflow) {
    note(
      route,
      label,
      "overflow-x",
      `scrollWidth ${overflow.scrollWidth} > ${overflow.docWidth}: ${overflow.offenders.join(" | ")}`
    );
  }

  // Anything the entrance animations left invisible is a content bug.
  const invisible = await page.evaluate(() => {
    const found = [];
    for (const element of document.querySelectorAll("h1, h2, h3, p, li, a, button, label")) {
      const text = element.textContent?.trim();
      if (!text || text.length < 3) continue;
      if (element.closest("[aria-hidden='true']")) continue;
      const style = getComputedStyle(element);
      if (style.visibility === "hidden" || Number(style.opacity) < 0.05 || style.display === "none") {
        if (element.closest("[data-qa-transient]")) continue;
        found.push(`${element.tagName.toLowerCase()}: ${text.slice(0, 40)}`);
      }
      if (found.length >= 5) break;
    }
    return found;
  });

  for (const item of invisible) note(route, label, "invisible-content", item);

  if (SHOTS && !reduced) {
    await mkdir(SHOT_DIR, { recursive: true });
    const name = `${route === "/" ? "home" : route.replace(/\//g, "")}-${viewport.name}.png`;
    await page.screenshot({ path: path.join(SHOT_DIR, name), fullPage: false });
  }

  await page.close();
}

async function serverIsUp() {
  try {
    const response = await fetch(BASE, { signal: AbortSignal.timeout(1500) });
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
}

async function main() {
  const reuse = await serverIsUp();
  if (reuse) console.log(`Nutze laufenden Server auf ${BASE} …`);
  else console.log("Starte Produktions-Server …");
  const server = reuse ? null : await startServer();

  const browser = await chromium.launch(launchOptions);
  try {
    for (const reduced of [false, true]) {
      const context = await browser.newContext({
        reducedMotion: reduced ? "reduce" : "no-preference",
        viewport: VIEWPORTS[3],
      });
      for (const viewport of reduced ? [VIEWPORTS[3]] : VIEWPORTS) {
        await context.setViewportSize?.({ width: viewport.width, height: viewport.height });
        for (const route of ROUTES) {
          const page = context.pages()[0];
          if (page) await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await auditPage(context, route, viewport, { reduced });
        }
      }
      await context.close();
    }
  } finally {
    await browser.close();
    server?.kill("SIGTERM");
  }

  if (problems.length === 0) {
    console.log("\n✓ QA sauber: keine Konsolenfehler, keine 404, kein horizontaler Überlauf.\n");
    return;
  }

  console.log(`\n✗ ${problems.length} Befund(e):\n`);
  const seen = new Set();
  for (const problem of problems) {
    const key = `${problem.kind}|${problem.detail}`;
    if (seen.has(key)) continue;
    seen.add(key);
    console.log(`  [${problem.route} · ${problem.viewport}] ${problem.kind}`);
    console.log(`      ${problem.detail}`);
  }
  console.log("");
  process.exitCode = 1;
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
