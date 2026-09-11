"use client"

import { LayoutTemplateIcon, RotateCcwIcon, VideoOffIcon, XIcon } from "lucide-react"
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

// Layar Review (prototipe baris 693–750): cek empat foto, pilih yang mau
// diulang (ketuk di strip atau di baris pemilih), lalu jadikan photostrip.
// Layar lebar: strip di panel kiri, isi di kanan (tengah vertikal); HP: satu
// kolom dengan aksi menempel di bawah.
export function ReviewScreen() {
  const s = useSession()
  const template = getTemplate(s.templateId)
  const filter = getFilter(s.filterId).css
  const count = s.selected.length
  const picked = [...s.selected].sort((a, b) => a - b).map((i) => i + 1)

  return (
    <div className="@container flex flex-1 flex-col">
      <div className="mx-auto grid w-full max-w-[440px] flex-1 gap-5 px-5 pt-3 @3xl:max-w-[880px] @3xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)] @3xl:grid-rows-[1fr_auto_auto_auto_1fr] @3xl:gap-x-14 @3xl:gap-y-7 @3xl:px-10 @3xl:py-10">
        <header className="flex flex-col gap-1.5 @3xl:col-start-2 @3xl:row-start-2 @3xl:gap-2">
          <h1 className="font-display text-display-md font-semibold @3xl:text-[40px] @3xl:leading-[1.1] @3xl:font-bold">
            Empat foto, jadi.
          </h1>
          <p className="text-small text-muted-foreground @3xl:text-body" aria-live="polite">
            {count
              ? `Foto ${picked.join(" & ")} bakal diulang berdua.`
              : "Cek dulu hasilnya. Ada yang kurang pas? Pilih buat diulang."}
          </p>
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-card px-2.5 py-1 text-caption text-muted-foreground">
            <VideoOffIcon aria-hidden className="size-3.5" />
            Kamera & mic dijeda, nyala lagi kalau ada foto diulang
          </span>
        </header>

        {/* Strip di panel bertitik; ketuk foto untuk pilih/lepas. */}
        <div className="relative flex justify-center overflow-hidden rounded-md border border-kabin-line-2 bg-kabin-sunken px-5 py-6 @3xl:col-start-1 @3xl:row-span-5 @3xl:row-start-1 @3xl:self-center @3xl:py-8">
          <span aria-hidden className="absolute inset-0 bg-dots [--dots-color:rgb(244_243_239/0.06)]" />
          <Strip
            template={template}
            tokens={{ date: formatStripDate(new Date()), host: SITE_HOST, names: stripNamesOf(s.snapshot) }}
            filter={filter}
            shadow="strip-dark"
            className="relative w-[min(100%,220px)] @3xl:w-[244px]"
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
                    on ? "bg-shutter/30 outline-shutter" : "outline-transparent hover:bg-darkroom/35"
                  )}
                >
                  <span className="absolute bottom-1.5 left-1.5 rounded-sm bg-darkroom/75 px-1.5 py-0.5 text-[10px] text-kertas">
                    Foto {i + 1}
                  </span>
                  <span
                    className={cn(
                      "absolute top-1/2 left-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-kertas transition-opacity duration-150",
                      on ? "animate-pop bg-shutter shadow-[0_4px_12px_rgb(0_0_0/0.3)]" : "bg-darkroom/80 opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <RotateCcwIcon aria-hidden className="size-3" strokeWidth={2.5} />
                    {on ? "Diulang" : "Ulang"}
                  </span>
                </button>
              )
            }}
          />
        </div>

        {/* Pemilih foto: alternatif yang jelas selain mengetuk strip. */}
        <fieldset className="flex min-w-0 flex-col gap-2.5 @3xl:col-start-2 @3xl:row-start-3">
            <legend className="mb-2.5 flex w-full items-baseline justify-between gap-3">
              <span className="text-small font-semibold">Ada yang mau diulang?</span>
              <span className="text-caption text-faint-foreground">opsional · bisa lebih dari satu</span>
            </legend>
            <div className="grid grid-cols-4 gap-2.5">
              {[0, 1, 2, 3].map((i) => {
                const f = s.frames[i]
                const on = s.selected.includes(i)
                return (
                  <button
                    key={i}
                    type="button"
                    aria-pressed={on}
                    aria-label={`Pilih foto ${i + 1} untuk diulang`}
                    onClick={() => s.toggleSelect(i)}
                    className={cn(
                      "relative aspect-[4/3] cursor-pointer overflow-hidden rounded-sm bg-kabin-sunken outline-none ring-2 ring-offset-2 ring-offset-background transition-[box-shadow] focus-visible:ring-flash",
                      on ? "ring-shutter" : "ring-transparent hover:ring-kabin-line"
                    )}
                  >
                    <span className="absolute inset-0 flex gap-px" style={filter !== "none" ? { filter } : undefined}>
                      {(["a", "b"] as const).map((side) => (
                        <span key={side} className="relative flex-1 overflow-hidden">
                          {f && <FrameFill source={f[side]} side={side} />}
                        </span>
                      ))}
                    </span>
                    <span className="absolute bottom-1 left-1 rounded-[4px] bg-darkroom/80 px-1.5 text-[10px] leading-4 text-kertas">
                      {i + 1}
                    </span>
                    {on && (
                      <span className="absolute inset-0 grid animate-fade-in place-items-center bg-shutter/40">
                        <RotateCcwIcon aria-hidden className="size-5 text-kertas" strokeWidth={2.5} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
        </fieldset>

        {/* Anak langsung grid: sticky butuh induk setinggi layar supaya bisa
            menempel penuh di bawah HP. */}
        <div className="sticky bottom-0 z-10 -mx-5 bg-linear-to-t from-background from-65% to-transparent px-5 pt-5 pb-[max(16px,env(safe-area-inset-bottom))] @3xl:static @3xl:col-start-2 @3xl:row-start-4 @3xl:mx-0 @3xl:bg-none @3xl:p-0">
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
              <div className="flex flex-col gap-1.5">
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
            <p className="mt-2 flex items-center justify-center gap-1.5 text-caption text-faint-foreground @3xl:justify-start">
              <LayoutTemplateIcon aria-hidden className="size-3.5" />
              Template {template.name} · bisa diganti di layar hasil
            </p>
        </div>
      </div>
    </div>
  )
}
