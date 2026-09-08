"use client";

import { useEffect, useState } from "react";
import { ScrollTrigger, registerGsap } from "./motion";
import { sectionIndex } from "@/content/de";

/**
 * The id of the section currently crossing the middle of the viewport.
 *
 * One set of triggers serves both readers of this: the progress line's label
 * and the header's active nav link. Returns null until the first trigger
 * resolves, so callers fall back to their own first entry.
 */
export function useActiveSection(): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    registerGsap();

    const triggers = sectionIndex
      .map(({ id }) => {
        const section = document.getElementById(id);
        if (!section) return null;
        const set = () => setActive(id);
        return ScrollTrigger.create({
          trigger: section,
          start: "top 50%",
          end: "bottom 50%",
          onEnter: set,
          onEnterBack: set,
        });
      })
      .filter(Boolean) as ScrollTrigger[];

    return () => triggers.forEach((trigger) => trigger.kill());
  }, []);

  return active;
}
