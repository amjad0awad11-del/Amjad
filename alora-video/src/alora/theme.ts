import { continueRender, delayRender } from "remotion";
import { POPPINS } from "./fonts";

export const fontFamily = "Poppins";

// Faces are injected from inlined data URIs, so a render depends on neither the
// network nor the static-file server.
if (typeof document !== "undefined" && !document.getElementById("alora-fonts")) {
  const style = document.createElement("style");
  style.id = "alora-fonts";
  style.textContent = Object.entries(POPPINS)
    .map(
      ([weight, src]) =>
        `@font-face{font-family:"Poppins";src:url(${src}) format("woff2");font-weight:${weight};font-style:normal;font-display:block;}`,
    )
    .join("\n");
  document.head.appendChild(style);

  const handle = delayRender("Loading Poppins");
  Promise.all(Object.keys(POPPINS).map((w) => document.fonts.load(`${w} 100px Poppins`)))
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error("Font load failed", err);
      continueRender(handle);
    });
}

export const palette = {
  green: "#2E4A38",
  greenDeep: "#1C2F24",
  greenSoft: "#4A6B54",
  cream: "#F4EFE2",
  creamWarm: "#EDE5D2",
  gold: "#C6A75C",
  amber: "#8A4711",
  amberLight: "#C4761F",
  amberGlow: "#E0A050",
  ink: "#16211A",
  sage: "#9DB39A",
} as const;

export const scenes = {
  hook: { from: 0, duration: 125 },
  problem: { from: 125, duration: 140 },
  product: { from: 265, duration: 195 },
  transform: { from: 460, duration: 145 },
  cta: { from: 605, duration: 115 },
} as const;

export const TOTAL = 720;
