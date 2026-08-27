"use client";

import { createElement, useRef } from "react";
import type { ElementType, ReactNode } from "react";
import SplitType from "split-type";
import clsx from "clsx";
import {
  gsap,
  DUR,
  EASE,
  STAGGER,
  START,
  prefersReducedMotion,
  simpleFade,
} from "@/lib/motion";
import { useGsap } from "@/lib/useGsap";

type RevealTextProps = {
  children: ReactNode;
  /** Rendered element — headings pass their real level so the outline stays correct. */
  as?: ElementType;
  className?: string;
  /** `hero` uses the longer, further-travelled entrance (A6). */
  variant?: "hero" | "section";
  /** Delay in seconds, for sequencing against a sibling timeline. */
  delay?: number;
  /** Play immediately instead of waiting for the element to scroll into view. */
  immediate?: boolean;
  /** Hold the initial hidden state until this flips true (used after the preloader). */
  play?: boolean;
  id?: string;
};

/**
 * A10 / A6 — masked line reveal.
 *
 * split-type breaks the text into lines, each wrapped in an overflow-hidden
 * box; the lines then slide up from below with a stagger. Initial states are
 * written by GSAP rather than CSS, so text stays readable if JS never runs.
 */
export function RevealText({
  children,
  as = "p",
  className,
  variant = "section",
  delay = 0,
  immediate = false,
  play = true,
  id,
}: RevealTextProps) {
  const scope = useRef<HTMLElement>(null);

  useGsap(
    () => {
      const element = scope.current;
      if (!element || !play) return;

      if (prefersReducedMotion()) {
        simpleFade(element, {
          scrollTrigger: immediate ? undefined : { trigger: element, start: START.default, once: true },
          delay,
        });
        return;
      }

      const split = new SplitType(element, {
        types: "lines",
        lineClass: "reveal-line",
        tagName: "span",
      });

      const lines = split.lines ?? [];
      if (lines.length === 0) return;

      // split-type gives us the masks; the inner span is what actually travels.
      const inners = lines.map((line) => {
        const inner = document.createElement("span");
        inner.style.display = "block";
        inner.style.willChange = "transform";
        while (line.firstChild) inner.appendChild(line.firstChild);
        line.appendChild(inner);
        return inner;
      });

      const isHero = variant === "hero";

      gsap.set(inners, { yPercent: isHero ? 112 : 100, rotate: isHero ? 2 : 0 });

      const tween = gsap.to(inners, {
        yPercent: 0,
        rotate: 0,
        duration: isHero ? DUR.hero : DUR.base,
        ease: EASE.expo,
        stagger: STAGGER.lines,
        delay,
        onComplete: () => {
          inners.forEach((inner) => {
            inner.style.willChange = "";
          });
        },
        scrollTrigger: immediate
          ? undefined
          : { trigger: element, start: START.default, once: true },
      });

      return () => {
        tween.kill();
        split.revert();
      };
    },
    scope,
    [play, variant, delay, immediate]
  );

  return createElement(
    as,
    { ref: scope, className: clsx(className), id },
    children
  );
}
