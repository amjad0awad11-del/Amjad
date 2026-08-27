"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger, EASE, registerGsap } from "@/lib/motion";

/**
 * A14 — section theme morph.
 *
 * Each `<section data-theme>` owns a trigger across the middle of the viewport
 * that tweens --bg/--fg on <body>. Sections also paint their own background in
 * CSS, so the page is correct before this runs and if JS never loads; this only
 * blends the ground the fixed header and progress line sit on.
 *
 * Runs even under reduced motion — it is a colour change, not movement — but
 * snaps instead of tweening.
 */
export function ThemeMorph({ reduced }: { reduced: boolean }) {
  useEffect(() => {
    registerGsap();
    const sections = gsap.utils.toArray<HTMLElement>("section[data-theme]");
    if (sections.length === 0) return;

    const read = (element: HTMLElement) => {
      const styles = getComputedStyle(element);
      return {
        bg: styles.getPropertyValue("--theme-bg").trim(),
        fg: styles.getPropertyValue("--theme-fg").trim(),
      };
    };

    const apply = (element: HTMLElement) => {
      const { bg, fg } = read(element);
      if (!bg || !fg) return;
      gsap.to(document.body, {
        "--bg": bg,
        "--fg": fg,
        duration: reduced ? 0 : 0.6,
        ease: EASE.inOut,
        overwrite: "auto",
      });
    };

    const triggers = sections.map((section) =>
      ScrollTrigger.create({
        trigger: section,
        start: "top 50%",
        end: "bottom 50%",
        onEnter: () => apply(section),
        onEnterBack: () => apply(section),
      })
    );

    // Paint the section already under the fold line on first load.
    const initial =
      sections.find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2;
      }) ?? sections[0];
    if (initial) apply(initial);

    return () => triggers.forEach((trigger) => trigger.kill());
  }, [reduced]);

  return null;
}
