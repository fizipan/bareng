"use client"

import { CheckIcon, RotateCcwIcon } from "lucide-react"
import { StripIcon } from "@/components/brand/strip-icon"
import { FrameFill } from "@/components/strip/frame-fill"
import { Strip } from "@/components/strip/strip"
import { Button } from "@/components/ui/button"
import { SITE_HOST } from "@/lib/brand"
import { formatStripDate } from "@/lib/format"
import { getFilter } from "@/lib/templates/filters"
import { getTemplate } from "@/lib/templates/builtin"
import { cn } from "@/lib/utils"
import { useSession } from "@/stores/session"

// Layar Review (prototipe baris 693–750): ketuk foto untuk dipilih ulang.
export function ReviewScreen() {
  const s = useSession()
  const template = getTemplate(s.templateId)
  const count = s.selected.length

  return (
    <div className="flex flex-col gap-5 px-5 pt-3 pb-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-display-md font-semibold">Empat foto, jadi.</h1>
        <p className="text-small text-muted-foreground" aria-live="polite">
          {count ? `${count} foto dipilih buat diulang` : "Ketuk foto yang mau diulang, atau langsung jadikan strip."}
        </p>
      </div>

      <div className="flex justify-center">
        <Strip
          template={template}
          tokens={{ date: formatStripDate(new Date()), host: SITE_HOST }}
          filter={getFilter(s.filterId).css}
          shadow="strip-dark"
          className="w-[min(100%,236px)]"
          renderHalf={(i, side) => {
            const f = s.frames[i]
            return f ? <FrameFill source={f[side]} side={side} /> : null
          }}
          renderSlot={(i) => {
            const picked = s.selected.includes(i)
            return (
              <button
                type="button"
                aria-pressed={picked}
                aria-label={`Foto ${i + 1}${picked ? ", dipilih buat diulang" : ""}`}
                onClick={() => s.toggleSelect(i)}
                className={cn(
                  "absolute inset-0 outline-3 -outline-offset-2 transition-[outline-color] duration-150",
                  picked ? "outline-shutter" : "outline-transparent"
                )}
              >
                <span className="absolute bottom-1.5 left-1.5 rounded-sm bg-darkroom/70 px-1.5 py-0.5 text-[10px] text-kertas">
                  Foto {i + 1}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-1.5 right-1.5 flex size-[22px] items-center justify-center rounded-full border-[1.5px] transition-colors duration-150",
                    picked ? "border-shutter bg-shutter" : "border-[#5C5870] bg-darkroom/70"
                  )}
                >
                  {picked && <CheckIcon className="size-3 text-kertas" strokeWidth={3} />}
                </span>
              </button>
            )
          }}
        />
      </div>

      {count > 0 ? (
        <div className="flex flex-col gap-2.5">
          <Button onClick={s.retakeSelected}>
            <RotateCcwIcon data-icon="inline-start" />
            {count > 1 ? `Ulang ${count} foto` : "Ulang foto ini"}
          </Button>
          <div className="flex gap-2.5">
            <Button variant="secondary" size="sm" className="flex-1" onClick={s.clearSelect}>
              Batal pilih
            </Button>
            <Button variant="secondary" size="sm" className="flex-1" onClick={s.makeStrip}>
              Lanjut aja
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <Button onClick={s.makeStrip}>
            <StripIcon data-icon="inline-start" />
            Jadikan photostrip
          </Button>
          <Button variant="ghost" className="text-label text-muted-foreground" onClick={s.retakeAll}>
            Ulang semua
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 text-caption text-faint-foreground">
        <span>Template {template.name}</span>
        <span>Bisa diganti nanti di layar hasil</span>
      </div>
    </div>
  )
}
