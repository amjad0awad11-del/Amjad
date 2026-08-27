"use client";

import { useState } from "react";
import { AccordionItem } from "@/components/ui/Accordion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { faq } from "@/content/de";

/** S12 — FAQ. One row open at a time (A23). */
export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id={faq.id} data-theme="dark" aria-labelledby="faq-title" className="section-y">
      <div className="wrap grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeader label={faq.label} title={faq.title} titleId="faq-title" />
        </div>

        <ul className="flex flex-col lg:col-span-8">
          {faq.items.map((item, index) => (
            <AccordionItem
              key={item.q}
              question={item.q}
              answer={item.a}
              open={open === index}
              onToggle={() => setOpen(open === index ? null : index)}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
