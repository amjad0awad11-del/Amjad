import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { existsSync, readdirSync } from "node:fs";

const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";
const SHOTS = path.join(import.meta.dirname, "..", "qa-screenshots");
await mkdir(SHOTS, { recursive: true });
const VIDEO_URL =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663941589753/vTqSXAzrhLDJHcrm.mp4";

const results = [];
const check = (name, pass, detail = "") =>
  results.push({ name, pass: !!pass, detail: String(detail) });

/**
 * Prefer whatever Chromium is actually on this machine.
 *
 * Playwright normally downloads a build pinned to its own version, but CI images
 * (and this project's build environment) often ship a slightly different one
 * under PLAYWRIGHT_BROWSERS_PATH. Auto-detecting keeps the script runnable in
 * both places instead of failing with "Executable doesn't exist".
 */
function findChromium() {
  if (process.env.QA_CHROMIUM) return process.env.QA_CHROMIUM;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !existsSync(root)) return undefined;
  const candidates = readdirSync(root)
    .filter((entry) => entry.startsWith("chromium-"))
    .sort()
    .reverse()
    .map((entry) => path.join(root, entry, "chrome-linux", "chrome"));
  return candidates.find((candidate) => existsSync(candidate));
}

const executablePath = findChromium();
if (executablePath) console.error(`(using Chromium at ${executablePath})`);
const browser = await chromium.launch({ executablePath });

/* -------------------------------------------------------------------------- */
/* Synthesize a short, real, decodable clip.                                   */
/* The supplied CDN is blocked by this environment's egress policy, so to test  */
/* the *success* path we record a few seconds of canvas animation in-browser    */
/* and serve those bytes in place of the real file.                            */
/* -------------------------------------------------------------------------- */
async function makeTestClip() {
  const page = await browser.newPage();
  await page.goto("about:blank");
  const base64 = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    const stream = canvas.captureStream(25);
    const chunks = [];
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    recorder.ondataavailable = (event) => chunks.push(event.data);
    recorder.start();

    let frame = 0;
    await new Promise((resolve) => {
      const draw = () => {
        ctx.fillStyle = `hsl(28, 45%, ${18 + (frame % 40) * 0.5}%)`;
        ctx.fillRect(0, 0, 640, 360);
        ctx.fillStyle = "#C8863C";
        ctx.fillRect(60 + frame * 2, 150, 200, 50);
        frame += 1;
        if (frame < 50) requestAnimationFrame(draw);
        else resolve();
      };
      draw();
    });

    recorder.stop();
    const blob = await new Promise((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
    });
    const buffer = await blob.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  });
  await page.close();
  return Buffer.from(base64, "base64");
}

const clip = await makeTestClip();
check("test clip synthesized", clip.length > 1000, `${clip.length} bytes`);

/** Serve the synthesized clip wherever the page asks for the supplied video. */
async function serveClip(context) {
  await context.route(VIDEO_URL, (route) =>
    route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "video/webm",
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
      },
      body: clip,
    }),
  );
}

/* -------------------------------------------------------------------------- */
/* 1. Responsive pass at the four required widths                              */
/* -------------------------------------------------------------------------- */
const VIEWPORTS = [
  { label: "375", width: 375, height: 812, mobile: true },
  { label: "768", width: 768, height: 1024, mobile: false },
  { label: "1280", width: 1280, height: 800, mobile: false },
  { label: "1920", width: 1920, height: 1080, mobile: false },
];

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    hasTouch: vp.mobile,
    locale: "de-DE",
  });
  await serveClip(context);
  const page = await context.newPage();

  /**
   * Record the hero card's transform on every animation frame, starting before
   * any of the page's own scripts run.
   *
   * The mobile hero opens as a one-shot entrance that fires the moment the card
   * is in view — which is during hydration, milliseconds after load. Polling
   * from Node always arrives after it has finished (each round-trip costs more
   * than the 1.1s tween), so the sampling has to happen in-page.
   */
  await page.addInitScript(() => {
    window.__cardFrames = [];
    const tick = () => {
      const card = document.querySelector(".hero-card");
      if (card) {
        const t = getComputedStyle(card).transform;
        const frames = window.__cardFrames;
        if (frames[frames.length - 1] !== t) frames.push(t);
      }
      if (window.__cardFrames.length < 400) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  const consoleErrors = [];
  const consoleWarnings = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
    if (message.type() === "warning") consoleWarnings.push(message.text());
  });
  const failedRequests = [];
  page.on("requestfailed", (request) =>
    failedRequests.push(`${request.url()} — ${request.failure()?.errorText}`),
  );

  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(1200);

  await page.screenshot({ path: `${SHOTS}/${vp.label}-01-hero.png` });

  // No horizontal overflow at any width — a classic mobile failure.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  check(`${vp.label}: no horizontal overflow`, overflow <= 1, `${overflow}px`);

  /* --- hero opening ------------------------------------------------------- */
  const readCard = () =>
    page.evaluate(() => {
      const card = document.querySelector(".hero-card");
      if (!card) return null;
      const style = getComputedStyle(card);
      return {
        transform: style.transform,
        clipPath: style.clipPath,
        armed: card.getAttribute("data-hero-armed"),
      };
    });

  // Mobile/tablet opens as a one-shot entrance that fires as soon as the hero
  // is in view — i.e. during load. Reading it once after a long wait always
  // shows the finished state, so sample rapidly and count distinct frames.
  if (vp.width < 900) {
    const frames = await page.evaluate(() => window.__cardFrames ?? []);
    const distinct = new Set(frames.filter((f) => f && f !== "none"));
    check(`${vp.label}: hero card animates open on entry`, distinct.size >= 2,
      `${distinct.size} distinct transforms across ${frames.length} recorded frames`);
    check(`${vp.label}: entrance ends at scale 1`,
      /matrix\(1,\s*0,\s*0,\s*1/.test(frames[frames.length - 1] ?? ""),
      frames[frames.length - 1]?.slice(0, 40));
    check(`${vp.label}: no 3D rotation on small screens`,
      [...distinct].every((t) => !t.startsWith("matrix3d")),
      [...distinct].find((t) => t.startsWith("matrix3d"))?.slice(0, 40) ?? "none found");
  }

  // Desktop is a scrubbed, pinned timeline. Drive it in steps.
  const transforms = [];
  for (const ratio of [0, 0.3, 0.6, 1.2]) {
    await page.evaluate((r) => window.scrollTo(0, window.innerHeight * r), ratio);
    // scrub: 0.6 means the tween eases towards the scroll position, so allow
    // it to settle before reading, otherwise the last sample is mid-catch-up.
    await page.waitForTimeout(ratio === 1.2 ? 1800 : 700);
    transforms.push(await readCard());
  }
  await page.screenshot({ path: `${SHOTS}/${vp.label}-02-scrolled.png` });

  if (vp.width >= 900) {
    const changed =
      transforms[0] &&
      transforms[3] &&
      transforms[0].transform !== transforms[3].transform;
    check(`${vp.label}: hero card transforms on scroll`, changed,
      `start=${transforms[0]?.transform?.slice(0, 40)} … end=${transforms[3]?.transform?.slice(0, 40)}`);

    check(`${vp.label}: card starts tilted in 3D`,
      transforms[0]?.transform?.startsWith("matrix3d"),
      transforms[0]?.transform?.slice(0, 50));

    check(`${vp.label}: card starts cropped`,
      /inset/.test(transforms[0]?.clipPath ?? ""),
      transforms[0]?.clipPath);

    // Front-facing at the end: allow a sub-pixel epsilon, since a scrubbed
    // timeline settles asymptotically rather than snapping to exactly 1.
    const numbers = (transforms[3]?.transform ?? "").match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
    const flat =
      transforms[3]?.transform === "none" ||
      (numbers.length >= 6 &&
        Math.abs(numbers[0] - 1) < 0.01 &&
        Math.abs(numbers[1]) < 0.02 &&
        Math.abs(numbers[2]) < 0.02 &&
        Math.abs(numbers[3] - 1) < 0.01);
    check(`${vp.label}: card ends front-facing (rotateX/Y ~ 0, scale ~ 1)`, flat,
      transforms[3]?.transform?.slice(0, 70));

    check(`${vp.label}: crop fully open at the end`,
      /inset\(0(px|%)?\s/.test(transforms[3]?.clipPath ?? "") ||
        transforms[3]?.clipPath === "none",
      transforms[3]?.clipPath);
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  /* --- full page shot ---------------------------------------------------- */
  await page.screenshot({
    path: `${SHOTS}/${vp.label}-03-full.png`,
    fullPage: true,
  });

  check(`${vp.label}: no console errors`, consoleErrors.length === 0,
    consoleErrors.slice(0, 3).join(" | "));
  check(`${vp.label}: no failed requests`, failedRequests.length === 0,
    failedRequests.slice(0, 3).join(" | "));
  check(`${vp.label}: no console warnings`, consoleWarnings.length === 0,
    consoleWarnings.slice(0, 3).join(" | "));

  await context.close();
}

/* -------------------------------------------------------------------------- */
/* 2. Structure, semantics, CTAs, video config (desktop)                       */
/* -------------------------------------------------------------------------- */
{
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: "de-DE",
  });
  await serveClip(context);
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(1500);

  // Landmarks
  for (const [label, selector] of [
    ["header", "header"],
    ["main", "main#inhalt"],
    ["footer", "footer"],
    ["nav", "nav[aria-label='Hauptnavigation']"],
  ]) {
    check(`landmark: ${label}`, (await page.locator(selector).count()) > 0);
  }

  // Exactly one h1
  const h1 = await page.locator("h1").allTextContents();
  check("exactly one h1", h1.length === 1, JSON.stringify(h1));

  // Heading order never skips a level
  const levels = await page.evaluate(() =>
    [...document.querySelectorAll("h1,h2,h3,h4")].map((h) =>
      Number(h.tagName[1]),
    ),
  );
  let skips = 0;
  for (let i = 1; i < levels.length; i += 1) {
    if (levels[i] - levels[i - 1] > 1) skips += 1;
  }
  check("no skipped heading levels", skips === 0, `levels=${levels.join(",")} skips=${skips}`);

  // Route CTA -> the supplied Google Maps listing, new tab, safe rel
  const routeLinks = await page.evaluate(() =>
    [...document.querySelectorAll("a")]
      .filter((a) => a.textContent.includes("Route planen"))
      .map((a) => ({ href: a.href, target: a.target, rel: a.rel })),
  );
  check("Route planen buttons exist", routeLinks.length >= 2, `${routeLinks.length} found`);
  check(
    "Route planen -> supplied Google Maps listing",
    routeLinks.length > 0 &&
      routeLinks.every((l) => l.href.startsWith("https://www.google.de/maps/place/")),
    routeLinks[0]?.href?.slice(0, 80),
  );
  check(
    "Route planen opens new tab with noopener",
    routeLinks.every((l) => l.target === "_blank" && l.rel.includes("noopener")),
    JSON.stringify(routeLinks[0]),
  );

  // The reviews CTA is always reachable even while Gästestimmen is hidden
  const reviewCta = await page.locator(
    "a:has-text('Weitere Bewertungen auf Google ansehen')",
  ).count();
  check("reviews CTA present", reviewCta >= 1, `${reviewCta} found`);

  // Gästestimmen must be absent while no verified reviews exist
  check(
    "Gästestimmen hidden without verified data",
    (await page.locator("#gaestestimmen").count()) === 0,
  );

  // Video element configuration
  const video = await page.evaluate(() => {
    const v = document.querySelector("video");
    if (!v) return null;
    return {
      muted: v.muted,
      playsInline: v.playsInline,
      preload: v.preload,
      hasAutoplayAttr: v.hasAttribute("autoplay"),
      hasLoopAttr: v.hasAttribute("loop"),
      controls: v.controls,
      poster: v.getAttribute("poster"),
      ariaLabel: v.getAttribute("aria-label"),
      currentTime: v.currentTime,
      paused: v.paused,
      readyState: v.readyState,
    };
  });
  check("video: muted", video?.muted);
  check("video: playsInline", video?.playsInline);
  check("video: preload=metadata", video?.preload === "metadata", video?.preload);
  check("video: no autoplay attribute", video?.hasAutoplayAttr === false);
  check("video: no loop attribute", video?.hasLoopAttr === false);
  check("video: native controls off by default", video?.controls === false);
  check("video: poster set", !!video?.poster, video?.poster);
  check("video: aria-label set", !!video?.ariaLabel, video?.ariaLabel?.slice(0, 50));
  check("video: started playing once hero visible", (video?.currentTime ?? 0) > 0,
    `currentTime=${video?.currentTime}`);

  // Pauses when scrolled far away
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  const afterScroll = await page.evaluate(() => {
    const v = document.querySelector("video");
    return { paused: v?.paused, time: v?.currentTime };
  });
  check("video: pauses when far out of view", afterScroll.paused === true,
    JSON.stringify(afterScroll));

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  // Images: every <img> needs an alt attribute (may be "" when decorative)
  const imgs = await page.evaluate(() =>
    [...document.querySelectorAll("img")].map((i) => ({
      src: i.currentSrc || i.src,
      hasAlt: i.hasAttribute("alt"),
      alt: i.getAttribute("alt"),
      loading: i.loading,
    })),
  );
  check("all images have an alt attribute", imgs.every((i) => i.hasAlt),
    `${imgs.filter((i) => !i.hasAlt).length} missing of ${imgs.length}`);
  check("below-fold images lazy-loaded", imgs.some((i) => i.loading === "lazy"),
    `${imgs.filter((i) => i.loading === "lazy").length} lazy of ${imgs.length}`);

  // Images served in a modern format through the optimizer
  const optimized = imgs.filter((i) => i.src.includes("/_next/image")).length;
  check("images routed through next/image optimizer", optimized > 0,
    `${optimized} of ${imgs.length}`);

  // JSON-LD: valid, and free of unverified claims
  const jsonLd = await page.evaluate(() => {
    const tag = document.querySelector('script[type="application/ld+json"]');
    return tag ? tag.textContent : null;
  });
  let parsed = null;
  try {
    parsed = JSON.parse(jsonLd);
  } catch {
    /* handled below */
  }
  check("JSON-LD parses", !!parsed);
  check("JSON-LD type is a café/restaurant",
    JSON.stringify(parsed?.["@type"]).includes("CafeOrCoffeeShop"),
    JSON.stringify(parsed?.["@type"]));
  check("JSON-LD address correct",
    parsed?.address?.streetAddress === "Oberwallstraße 55" &&
      parsed?.address?.postalCode === "47441",
    JSON.stringify(parsed?.address));
  for (const forbidden of [
    "aggregateRating",
    "telephone",
    "openingHoursSpecification",
    "priceRange",
    "menu",
  ]) {
    check(`JSON-LD omits unverified "${forbidden}"`,
      parsed && !(forbidden in parsed));
  }

  // Touch targets
  const small = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll(
      "header a, header button, main a, main button",
    )) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.height < 44 - 0.5) {
        out.push(`${el.tagName}.${el.className?.toString().slice(0, 18)} h=${r.height.toFixed(1)}`);
      }
    }
    return out;
  });
  check("interactive targets >= 44px tall", small.length === 0,
    small.slice(0, 5).join(" | "));

  // German only — no leftover English UI labels
  const bodyText = await page.locator("body").innerText();
  const english = ["Lorem ipsum", "Read more", "Learn more", "Contact us", "Opening hours", "Home"]
    .filter((word) => bodyText.includes(word));
  check("no English UI labels / lorem ipsum", english.length === 0, english.join(", "));

  await context.close();
}

/* -------------------------------------------------------------------------- */
/* 3. Keyboard + mobile drawer                                                 */
/* -------------------------------------------------------------------------- */
{
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    locale: "de-DE",
  });
  await serveClip(context);
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(900);

  // Skip link is the first tab stop and becomes visible
  await page.keyboard.press("Tab");
  const firstFocus = await page.evaluate(() => ({
    text: document.activeElement?.textContent?.trim(),
    cls: document.activeElement?.className,
  }));
  check("first tab stop is the skip link",
    firstFocus.cls?.includes("skip-link"), JSON.stringify(firstFocus));

  // Drawer: open, focus moves in, Escape closes, focus returns
  await page.locator("button[aria-label='Menü öffnen']").click();
  await page.waitForTimeout(500);
  const drawerOpen = await page.evaluate(() => {
    const dialog = document.querySelector("[role='dialog'][aria-label='Navigationsmenü']");
    return {
      present: !!dialog,
      focusLabel: document.activeElement?.getAttribute("aria-label"),
      expanded: document
        .querySelector("button[aria-label='Menü öffnen']")
        ?.getAttribute("aria-expanded"),
    };
  });
  check("drawer opens as a modal dialog", drawerOpen.present, JSON.stringify(drawerOpen));
  check("focus moves into the drawer", drawerOpen.focusLabel === "Menü schließen",
    drawerOpen.focusLabel);
  check("toggle reports aria-expanded=true", drawerOpen.expanded === "true");
  await page.screenshot({ path: `${SHOTS}/375-04-drawer.png` });

  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  const afterEscape = await page.evaluate(() => ({
    expanded: document
      .querySelector("button[aria-label='Menü öffnen']")
      ?.getAttribute("aria-expanded"),
    focusLabel: document.activeElement?.getAttribute("aria-label"),
  }));
  check("Escape closes the drawer", afterEscape.expanded === "false",
    JSON.stringify(afterEscape));
  check("focus returns to the menu button",
    afterEscape.focusLabel === "Menü öffnen", afterEscape.focusLabel);

  // Body scroll is released again
  const overflowAfter = await page.evaluate(() => document.body.style.overflow);
  check("body scroll released after close", overflowAfter !== "hidden",
    `overflow="${overflowAfter}"`);

  await context.close();
}

/* -------------------------------------------------------------------------- */
/* 4. Gallery lightbox keyboard behaviour                                      */
/* -------------------------------------------------------------------------- */
{
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: "de-DE",
  });
  await serveClip(context);
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "load" });
  await page.locator("#impressionen").scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);

  const tiles = page.locator("#impressionen ul button");
  const tileCount = await tiles.count();
  check("gallery renders all tiles", tileCount === 8, `${tileCount} tiles`);

  await tiles.nth(2).click();
  await page.waitForTimeout(500);
  const LIGHTBOX = "[role='dialog'][aria-label='Bildergalerie – Vollbildansicht']";
  const lb = await page.evaluate((selector) => {
    const dialog = document.querySelector(selector);
    return {
      present: !!dialog,
      label: dialog?.getAttribute("aria-label"),
      counter: dialog?.querySelector("[aria-live='polite']")?.textContent,
      focus: document.activeElement?.getAttribute("aria-label"),
      // Proves the nav drawer is no longer masquerading as an open dialog.
      openDialogs: document.querySelectorAll("[role='dialog']").length,
    };
  }, LIGHTBOX);
  check("lightbox opens as modal dialog", lb.present, JSON.stringify(lb));
  check("lightbox counter announced", /Bild 3 von 8/.test(lb.counter ?? ""), lb.counter);
  check("focus moves to close button", lb.focus === "Schließen", lb.focus);
  check("only one dialog reports itself as open", lb.openDialogs === 1,
    `${lb.openDialogs} elements with role=dialog`);
  await page.screenshot({ path: `${SHOTS}/1280-05-lightbox.png` });

  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(400);
  const afterArrow = await page.evaluate(
    (selector) => document.querySelector(`${selector} [aria-live='polite']`)?.textContent,
    LIGHTBOX,
  );
  check("ArrowRight advances the lightbox", /Bild 4 von 8/.test(afterArrow ?? ""),
    afterArrow);

  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  const closed = await page.evaluate((selector) => ({
    present: !!document.querySelector(selector),
    focusLabel: document.activeElement?.getAttribute("aria-label"),
  }), LIGHTBOX);
  check("Escape closes the lightbox", closed.present === false);
  check("focus returns to the opening thumbnail",
    (closed.focusLabel ?? "").includes("Bild vergrößern"),
    closed.focusLabel?.slice(0, 60));

  await context.close();
}

/* -------------------------------------------------------------------------- */
/* 5. Reduced motion                                                           */
/* -------------------------------------------------------------------------- */
{
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
    locale: "de-DE",
  });
  await serveClip(context);
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(1500);

  const rm = await page.evaluate(() => {
    const card = document.querySelector(".hero-card");
    const v = document.querySelector("video");
    return {
      armed: card?.getAttribute("data-hero-armed"),
      transform: getComputedStyle(card).transform,
      clipPath: getComputedStyle(card).clipPath,
      revealReady: document.documentElement.classList.contains("reveal-ready"),
      videoTime: v?.currentTime,
      videoPaused: v?.paused,
      playButton: !!document.querySelector(".hero-media-play"),
      h1Visible: getComputedStyle(document.querySelector("h1")).opacity,
    };
  });
  check("reduced motion: hero card not armed", rm.armed === null, `armed=${rm.armed}`);
  check("reduced motion: card is flat / uncropped",
    (rm.transform === "none" || /matrix\(1,\s*0,\s*0,\s*1/.test(rm.transform)) &&
      rm.clipPath === "none",
    `transform=${rm.transform} clip=${rm.clipPath}`);
  check("reduced motion: scroll reveals not armed", rm.revealReady === false);
  check("reduced motion: video does NOT autoplay",
    rm.videoPaused === true && (rm.videoTime ?? 0) === 0,
    `paused=${rm.videoPaused} t=${rm.videoTime}`);
  check("reduced motion: explicit play button offered", rm.playButton === true);
  check("reduced motion: hero copy fully visible", rm.h1Visible === "1", rm.h1Visible);

  // Content is all present without any animation
  for (const id of ["auswahl", "ueber-uns", "impressionen", "besuch", "social"]) {
    const visible = await page.evaluate((sectionId) => {
      const el = document.getElementById(sectionId);
      if (!el) return false;
      return getComputedStyle(el).opacity === "1" && el.getBoundingClientRect().height > 40;
    }, id);
    check(`reduced motion: #${id} visible`, visible);
  }

  // The opt-in play button works and then exposes native controls
  await page.locator(".hero-media-play").click();
  await page.waitForTimeout(1200);
  const afterOptIn = await page.evaluate(() => {
    const v = document.querySelector("video");
    return { time: v?.currentTime, controls: v?.controls };
  });
  check("reduced motion: opt-in play starts the clip",
    (afterOptIn.time ?? 0) > 0, `t=${afterOptIn.time}`);
  check("reduced motion: native controls appear after opt-in",
    afterOptIn.controls === true);

  await page.screenshot({ path: `${SHOTS}/1280-06-reduced-motion.png` });
  await context.close();
}

/* -------------------------------------------------------------------------- */
/* 6. Video failure fallback                                                   */
/* -------------------------------------------------------------------------- */
{
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: "de-DE",
  });
  // Simulate the CDN being unreachable.
  await context.route(VIDEO_URL, (route) => route.abort("connectionfailed"));
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(2000);

  const fb = await page.evaluate(() => {
    const card = document.querySelector(".hero-card");
    const img = card?.querySelector("img");
    return {
      videoGone: !card?.querySelector("video"),
      posterImg: img?.currentSrc || img?.src || null,
      imgAlt: img?.getAttribute("alt"),
      headlineText: document.querySelector("h1")?.innerText,
      routeCta: !!document.querySelector("a[href*='google.de/maps']"),
      navCount: document.querySelectorAll("nav[aria-label='Hauptnavigation'] a").length,
      auswahlCards: document.querySelectorAll("#auswahl article").length,
      besuchPresent: !!document.querySelector("#besuch"),
    };
  });
  check("video failure: video element replaced", fb.videoGone, JSON.stringify(fb.videoGone));
  check("video failure: static poster rendered", !!fb.posterImg,
    fb.posterImg?.slice(0, 70));
  check("video failure: poster has meaningful alt", (fb.imgAlt ?? "").length > 20,
    fb.imgAlt?.slice(0, 50));
  check("video failure: hero copy intact",
    (fb.headlineText ?? "").includes("Frisch belegt"), fb.headlineText);
  check("video failure: route CTA still works", fb.routeCta);
  check("video failure: navigation intact", fb.navCount === 5, `${fb.navCount} links`);
  check("video failure: menu cards intact", fb.auswahlCards === 4, `${fb.auswahlCards} cards`);
  check("video failure: visit section intact", fb.besuchPresent);

  await page.screenshot({ path: `${SHOTS}/1280-07-video-failed.png` });
  await context.close();
}

await browser.close();

/* -------------------------------------------------------------------------- */
const failed = results.filter((r) => !r.pass);
const lines = results.map(
  (r) => `${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  — ${r.detail}` : ""}`,
);
console.log(lines.join("\n"));
console.log(
  `\n${results.length - failed.length}/${results.length} checks passed.` +
    (failed.length ? `\n\nFAILURES:\n${failed.map((f) => `  • ${f.name} — ${f.detail}`).join("\n")}` : ""),
);
await writeFile(`${SHOTS}/report.txt`, lines.join("\n"));
process.exitCode = failed.length ? 1 : 0;
