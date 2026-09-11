"use client"

import { CheckIcon, HandIcon, LayoutTemplateIcon, RotateCcwIcon, XIcon } from "lucide-react"
import { StripIcon } from "@/components/brand/strip-icon"
import { FrameFill } from "@/components/strip/frame-fill"
import { Strip } from "@/components/strip/strip"
import { Button } from "@/components/ui/button"
import { SITE_HOST } from "@/lib/brand"
import { formatStripDate } from "@/lib/format"
import { stripNamesOf } from "@/lib/session/room-state"
import { getFilter } from "@/lib/templates/filters"
import { getTemplate } from "@/lib/templates/builtin"
import { cn } from "@/lib/utils"
import { useSession } from "@/stores/session"

// Layar Review (prototipe baris 693–750): ketuk foto di strip untuk dipilih
// ulang. Layar lebar: strip di kiri, penjelasan & aksi di kanan; HP: aksi
// menempel di bawah supaya tidak perlu scroll melewati strip.
export function ReviewScreen() {
  const s = useSession()
  const template = getTemplate(s.templateId)
  const count = s.selected.length
  const picked = [...s.selected].sort((a, b) => a - b).map((i) => i + 1)

  return (
    <div className="@container flex flex-1 flex-col">
      <div className="mx-auto grid w-full max-w-[440px] flex-1 gap-5 px-5 pt-3 @3xl:max-w-[900px] @3xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)] @3xl:grid-rows-[auto_1fr] @3xl:gap-x-14 @3xl:gap-y-6 @3xl:px-10 @3xl:pt-10 @3xl:pb-12">
        <header className="flex flex-col gap-1.5 @3xl:col-start-2 @3xl:row-start-1 @3xl:gap-2.5 @3xl:pt-2">
          <h1 className="font-display text-display-md font-semibold @3xl:text-display-lg @3xl:font-bold">Empat foto, jadi.</h1>
          <p className="text-small text-muted-foreground @3xl:text-body" aria-live="polite">
            {count
              ? `Foto ${picked.join(" & ")} bakal diulang berdua.`
              : "Ketuk foto yang mau diulang, atau langsung jadikan photostrip."}
          </p>
        </header>

        <div className="flex justify-center @3xl:sticky @3xl:top-8 @3xl:col-start-1 @3xl:row-span-2 @3xl:row-start-1 @3xl:self-start">
          <Strip
            template={template}
            tokens={{ date: formatStripDate(new Date()), host: SITE_HOST, names: stripNamesOf(s.snapshot) }}
            filter={getFilter(s.filterId).css}
            shadow="strip-dark"
            className="w-[min(100%,236px)] @3xl:w-[300px]"
            renderHalf={(i, side) => {
              const f = s.frames[i]
              return f ? <FrameFill source={f[side]} side={side} /> : null
            }}
            renderSlot={(i) => {
              const on = s.selected.includes(i)
              return (
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={`Foto ${i + 1}${on ? ", dipilih buat diulang" : ""}`}
                  onClick={() => s.toggleSelect(i)}
                  className={cn(
                    "group absolute inset-0 cursor-pointer outline-3 -outline-offset-2 transition-[outline-color,background-color] duration-150 focus-visible:outline-flash",
                    on ? "bg-shutter/25 outline-shutter" : "outline-transparent hover:bg-kertas/10"
                  )}
                >
                  <span className="absolute bottom-1.5 left-1.5 rounded-sm bg-darkroom/75 px-1.5 py-0.5 text-[10px] text-kertas">
                    Foto {i + 1}
                  </span>
                  {on ? (
                    <span className="absolute top-1/2 left-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 animate-pop items-center gap-1 rounded-full bg-shutter px-2.5 py-1 text-[11px] font-semibold text-kertas shadow-[0_4px_12px_rgb(0_0_0/0.3)]">
                      <RotateCcwIcon aria-hidden className="size-3" strokeWidth={2.5} />
                      Diulang
                    </span>
                  ) : (
                    <span
                      aria-hidden
                      className="absolute top-1.5 right-1.5 flex size-[22px] items-center justify-center rounded-full border-[1.5px] border-[#5C5870] bg-darkroom/70 transition-colors group-hover:border-kertas/70"
                    />
                  )}
                  {on && (
                    <span aria-hidden className="absolute top-1.5 right-1.5 flex size-[22px] items-center justify-center rounded-full bg-shutter">
                      <CheckIcon className="size-3 text-kertas" strokeWidth={3} />
                    </span>
                  )}
                </button>
              )
            }}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-5 @3xl:col-start-2 @3xl:row-start-2">
          {/* Penjelasan singkat, hanya di layar lebar (di HP judulnya sudah cukup). */}
          <ul className="hidden flex-col gap-3 text-small text-soft-foreground @3xl:flex">
            {[
              { icon: HandIcon, text: "Ketuk foto di strip untuk memilih yang mau diulang, bisa lebih dari satu." },
              { icon: RotateCcwIcon, text: "Kalian berdua pose lagi cuma untuk foto yang dipilih." },
              { icon: LayoutTemplateIcon, text: `Template ${template.name} masih bisa diganti di layar hasil.` },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-card text-flash">
                  <Icon className="size-4" />
                </span>
                <span className="pt-1.5">{text}</span>
              </li>
            ))}
          </ul>

          <div className="sticky bottom-0 z-10 -mx-5 mt-auto bg-linear-to-t from-background from-65% to-transparent px-5 pt-6 pb-[max(16px,env(safe-area-inset-bottom))] @3xl:static @3xl:mx-0 @3xl:mt-0 @3xl:bg-none @3xl:p-0">
            {count > 0 ? (
              <div className="flex flex-col gap-2.5">
                <Button onClick={s.retakeSelected}>
                  <RotateCcwIcon data-icon="inline-start" />
                  {count > 1 ? `Ulang ${count} foto` : `Ulang foto ${picked[0]}`}
                </Button>
                <div className="flex gap-2.5">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={s.clearSelect}>
                    <XIcon data-icon="inline-start" />
                    Batal pilih
                  </Button>
                  <Button variant="secondary" size="sm" className="flex-1" onClick={s.makeStrip} disabled={!s.framesReady}>
                    <StripIcon data-icon="inline-start" />
                    Lanjut aja
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button onClick={s.makeStrip} disabled={!s.framesReady}>
                  <StripIcon data-icon="inline-start" className={cn(!s.framesReady && "animate-blink")} />
                  {s.framesReady ? "Jadikan photostrip" : "Nunggu foto terkirim…"}
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={s.retakeAll}>
                  <RotateCcwIcon data-icon="inline-start" />
                  Ulang semua
                </Button>
              </div>
            )}
            <p className="mt-3 text-center text-caption text-faint-foreground @3xl:hidden">
              Template {template.name} · bisa diganti di layar hasil
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
