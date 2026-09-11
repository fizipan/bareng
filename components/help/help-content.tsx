"use client"

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"
import { HelpBubble } from "@/components/art/legal-art"
import { ContactCard } from "@/components/legal/contact-card"
import { LegalLayout, LegalSection, LegalText } from "@/components/legal/legal-layout"
import { HELP_TOPICS } from "@/lib/content/help"
import { FeedbackForm } from "./feedback-form"

const TOC = [
  { id: "masalah", label: "Masalah umum" },
  { id: "masukan", label: "Kirim masukan" },
  { id: "kontak", label: "Kontak" },
]

// Pusat bantuan: masalah umum (akordeon) + form masukan/bug + kontak.
export function HelpContent({ initialKind, initialRoom }: { initialKind?: string | null; initialRoom?: string | null }) {
  return (
    <LegalLayout
      page="bantuan"
      title="Pusat bantuan"
      lede="Ada kendala, nemu bug, atau punya ide? Cek masalah umum dulu, atau langsung kirim ke kami."
      updated="11 September 2026"
      art={<HelpBubble />}
      toc={TOC}
    >
      <LegalSection id="masalah" title="Masalah umum">
        <AccordionPrimitive.Root multiple={false} className="flex flex-col gap-2">
          {HELP_TOPICS.map((t) => (
            <AccordionPrimitive.Item
              key={t.q}
              className="group/help overflow-hidden rounded-md bg-card transition-colors duration-200 data-open:bg-darkroom data-open:text-kertas"
            >
              <AccordionPrimitive.Header>
                <AccordionPrimitive.Trigger className="flex min-h-[52px] w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left text-label font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                  {t.q}
                  <span
                    aria-hidden
                    className="relative flex size-[26px] shrink-0 items-center justify-center rounded-full bg-background transition-colors duration-200 group-data-open/help:bg-shutter"
                  >
                    <span className="absolute h-0.5 w-3 rounded-[1px] bg-darkroom group-data-open/help:bg-kertas" />
                    <span className="absolute h-3 w-0.5 rounded-[1px] bg-darkroom transition-transform duration-200 ease-strip group-data-open/help:scale-y-0 group-data-open/help:bg-kertas" />
                  </span>
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <AccordionPrimitive.Panel className="h-(--accordion-panel-height) overflow-hidden transition-[height] duration-300 ease-strip data-ending-style:h-0 data-starting-style:h-0">
                <p className="max-w-[60ch] px-4 pb-4 text-small leading-[1.6] text-[#D9D7E0]">{t.a}</p>
              </AccordionPrimitive.Panel>
            </AccordionPrimitive.Item>
          ))}
        </AccordionPrimitive.Root>
      </LegalSection>

      <LegalSection id="masukan" title="Kirim masukan atau laporkan bug">
        <LegalText>Semua kiriman kami baca. Kalau mau dibalas, isi email kamu.</LegalText>
        <FeedbackForm initialKind={initialKind} initialRoom={initialRoom} />
      </LegalSection>

      <section id="kontak" className="scroll-mt-8">
        <ContactCard title="Lebih enak lewat email?" hint="Kami balas dalam 2 hari kerja." />
      </section>
    </LegalLayout>
  )
}
