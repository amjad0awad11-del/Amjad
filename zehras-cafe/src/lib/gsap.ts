"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Single registration point for GSAP plugins.
 *
 * `registerPlugin` is idempotent, but importing the plugin from one module
 * keeps it out of the server bundle and means every component shares the same
 * ScrollTrigger instance (important: ScrollTrigger keeps a global list of
 * triggers, and two copies would fight over scroll position).
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);

  // Only genuine tween-level defaults belong here. `force3D` is a CSSPlugin
  // per-tween special property, not a default — passing it through
  // `gsap.defaults()` makes GSAP try to animate a property called "force3D"
  // and log "Invalid property force3D set to true". GSAP already promotes
  // transformed elements with force3D: "auto", which is what we want anyway.
  gsap.defaults({ ease: "power3.out" });
}

export { gsap, ScrollTrigger };
