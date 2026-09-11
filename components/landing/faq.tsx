"use client"

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"
import type { FaqItem } from "@/lib/content/faq"

// FAQ ringkas (R0: 4 pertanyaan). Item terbuka berubah jadi kartu gelap.
// Di layar lebar dibagi dua kolom yang tingginya tidak saling mengikat.
export function Faq({ items }: { items: FaqItem[] }) {
  const half = Math.ceil(items.length / 2)
  const COLUMNS = [items.slice(0, half), items.slice(half)]
  return (
    <AccordionPrimitive.Root multiple={false} className="grid gap-2 @3xl:grid-cols-2 @3xl:items-start @3xl:gap-4">
      {COLUMNS.map((column, c) => (
        <div key={c} className="flex flex-col gap-2 @3xl:gap-4">
          {column.map((item) => (
        <AccordionPrimitive.Item
          key={item.q}
          className="group/faq overflow-hidden rounded-md bg-card text-foreground transition-colors duration-200 data-open:bg-darkroom data-open:text-kertas"
        >
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="flex min-h-[52px] w-full items-center justify-between gap-3 px-3.5 py-[13px] text-left text-label font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              {item.q}
              <span
                aria-hidden
                className="relative flex size-[26px] shrink-0 items-center justify-center rounded-full bg-white transition-colors duration-200 group-data-open/faq:bg-shutter"
              >
                <span className="absolute h-0.5 w-3 rounded-[1px] bg-darkroom group-data-open/faq:bg-kertas" />
                <span className="absolute h-3 w-0.5 rounded-[1px] bg-darkroom transition-transform duration-200 ease-strip group-data-open/faq:scale-y-0 group-data-open/faq:bg-kertas" />
              </span>
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Panel className="h-(--accordion-panel-height) overflow-hidden transition-[height] duration-300 ease-strip data-ending-style:h-0 data-starting-style:h-0">
            <p className="max-w-[42ch] px-3.5 pb-4 text-small leading-[1.55] text-[#D9D7E0]">{item.a}</p>
          </AccordionPrimitive.Panel>
        </AccordionPrimitive.Item>
          ))}
        </div>
      ))}
    </AccordionPrimitive.Root>
  )
}
