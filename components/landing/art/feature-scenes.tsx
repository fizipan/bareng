"use client"

import { useEffect, useState } from "react"
import { ArrowRightIcon, CheckIcon, RotateCcwIcon, XIcon } from "lucide-react"
import { FrameFill } from "@/components/strip/frame-fill"
import { Strip } from "@/components/strip/strip"
import { SITE_HOST } from "@/lib/brand"
import { DEMO_FRAMES } from "@/lib/session/demo"
import { BUILTIN_TEMPLATES, getTemplate } from "@/lib/templates/builtin"
import { LOOKS } from "@/lib/templates/placeholder"
import { cn } from "@/lib/utils"
import { Figure } from "@/components/art/figure"
import { liveProps, useFinePointer, useInView, useLookAt, useReducedMotion, useTimeline } from "@/components/art/motion"

const FEATURES = [
  { title: "Hitung mundur serentak", desc: "Dua layar, satu momen. Selisihnya di bawah 0,15 detik." },
  { title: "Bukan screenshot video call", desc: "Tiap foto diambil dari kamera kalian sendiri, jadi hasilnya jernih." },
  { title: "Enam template", desc: "Pilih bareng, berubah di layar dia juga." },
  { title: "Ulang satu foto", desc: "Yang jelek diulang, tiga lainnya aman." },
]

const TIMELINES = [
  [700, 700, 700, 200, 1200],
  [500, 600, 900, 1200],
  [320, 320, 320, 320, 320, 320, 600],
  [700, 350, 250, 900, 1200],
] as const
// Gambar diam: momen yang menjelaskan fiturnya.
const STILL = [0, 4, 6, 0]

const TOKENS = { date: "14.02.27", host: SITE_HOST }
const MINI_TILTS = [-4, 3, -2, 4, -3, 2]

// Tiap fitur dijelaskan lewat adegan kecil. Diputar sekali saat pertama
// terlihat (bergiliran supaya tidak ramai), lalu lagi saat diketuk/disorot.
export function FeatureGrid() {
  const reduced = useReducedMotion()
  const fine = useFinePointer()
  const [ref, inView] = useInView<HTMLDivElement>(0.35)
  const [runs, setRuns] = useState([0, 0, 0, 0])
  useLookAt(ref, fine && !reduced)

  const replay = (i: number) => {
    if (reduced) return
    setRuns((r) => r.map((n, j) => (j === i ? n + 1 : n)))
  }

  return (
    <div ref={ref} {...liveProps(inView)} className="grid grid-cols-2 gap-3 @3xl:grid-cols-4 @3xl:gap-6">
      {FEATURES.map((f, i) => (
        <div
          key={f.title}
          onPointerEnter={(e) => e.pointerType === "mouse" && replay(i)}
          className="flex flex-col gap-1.5 rounded-md bg-card p-2.5 pb-4 @3xl:gap-2 @3xl:p-3 @3xl:pb-5"
        >
          <button
            type="button"
            onClick={() => replay(i)}
            aria-label={`Putar contoh: ${f.title}`}
            className="relative flex h-[108px] cursor-pointer items-center justify-center overflow-hidden rounded-[10px] bg-sunken outline-none focus-visible:ring-3 focus-visible:ring-ring/50 @3xl:h-36"
          >
            <span aria-hidden className="absolute inset-0 bg-dots" />
            {/* Visual sama di semua ukuran; di kartu mobile yang sempit diperkecil. */}
            <span aria-hidden className="relative flex scale-[0.7] items-center justify-center @3xl:scale-100">
              {inView && !reduced ? (
                <FeatureScene key={runs[i]} index={i} delay={runs[i] === 0 ? i * 450 : 0} />
              ) : (
                <FeatureFrame index={i} phase={STILL[i]} animate={false} />
              )}
            </span>
          </button>
          <span className="mt-2 px-1 text-small font-semibold @3xl:mt-3 @3xl:text-body">{f.title}</span>
          <span className="px-1 text-meta leading-[1.45] text-muted-foreground @3xl:text-small">{f.desc}</span>
        </div>
      ))}
    </div>
  )
}

function FeatureScene({ index, delay }: { index: number; delay: number }) {
  const [start, setStart] = useState(delay === 0)
  useEffect(() => {
    if (start) return
    const t = setTimeout(() => setStart(true), delay)
    return () => clearTimeout(t)
  }, [start, delay])
  if (!start) return <FeatureFrame index={index} phase={STILL[index]} animate={false} />
  return <PlayingFeature index={index} />
}

function PlayingFeature({ index }: { index: number }) {
  const phase = useTimeline(TIMELINES[index])
  return <FeatureFrame index={index} phase={phase} animate />
}

function FeatureFrame({ index, phase, animate }: { index: number; phase: number; animate: boolean }) {
  if (index === 0) return <SyncScene phase={phase} animate={animate} />
  if (index === 1) return <SharpScene phase={phase} animate={animate} />
  if (index === 2) return <TemplatesScene phase={phase} />
  return <RetakeScene phase={phase} animate={animate} />
}

// 0–2 hitung 3-2-1 di dua HP · 3 kilat · 4 "< 0,15 dtk"
function SyncScene({ phase, animate }: { phase: number; animate: boolean }) {
  const count = phase <= 2 ? 3 - phase : null
  return (
    <span className="relative flex items-center gap-2">
      <MiniPhone count={count} flash={phase === 3} animate={animate} />
      <span className="flex flex-col items-center gap-1.5">
        <span className="w-12 border-t-[1.5px] border-dashed border-grain" />
        <span
          className={cn(
            "rounded-full bg-darkroom px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-flash",
            animate && phase === 4 && "animate-pop"
          )}
        >
          &lt; 0,15 dtk
        </span>
      </span>
      <MiniPhone count={count} flash={phase === 3} animate={animate} />
    </span>
  )
}

function MiniPhone({ count, flash, animate }: { count: number | null; flash: boolean; animate: boolean }) {
  return (
    <span className="relative flex h-[76px] w-11 items-center justify-center overflow-hidden rounded-[9px] bg-darkroom font-display text-2xl font-extrabold text-flash ring-2 ring-darkroom-2">
      {count !== null ? (
        <span key={count} className={cn(animate && "animate-count")}>
          {count}
        </span>
      ) : (
        <CheckIcon className="size-5 text-ok" strokeWidth={3} />
      )}
      {flash && <span className="absolute inset-0 animate-flash bg-kertas" />}
    </span>
  )
}

// 0 video call buram · 1 panah · 2 foto jadi tajam · 3 centang
function SharpScene({ phase, animate }: { phase: number; animate: boolean }) {
  return (
    <span className="relative flex items-center gap-2.5">
      <span className="relative flex flex-col gap-1 rounded-[6px] bg-[#D5D2C9] p-1">
        <span className="flex gap-0.5 blur-[1.2px]">
          <MiniPhoto who="kamu" look={0} className="h-10 w-6" />
          <MiniPhoto who="dia" look={0} className="h-10 w-6" />
        </span>
        <span className="h-1.5 rounded-full bg-grain/50" />
        <Badge tone="no" />
      </span>
      <ArrowRightIcon
        className={cn("size-4 text-grain transition-[opacity,transform] duration-300", phase >= 1 ? "opacity-100" : "-translate-x-2 opacity-0")}
      />
      <span
        className={cn(
          "relative -rotate-3 bg-white px-1 pt-1 pb-3.5 shadow-strip transition-[opacity,transform] duration-300",
          phase >= 1 ? "opacity-100" : "translate-y-2 opacity-0"
        )}
      >
        <span className="flex gap-0.5">
          <MiniPhoto who="kamu" look={0} className="h-14 w-9" />
          <MiniPhoto who="dia" look={0} className="h-14 w-9" />
        </span>
        {/* Foto "dicuci" dari buram jadi tajam. */}
        {phase <= 2 && animate && (
          <span className={cn("absolute inset-1 bottom-3.5 bg-[#D5D2C9]/60 backdrop-blur-[3px]", phase === 2 && "animate-develop")} />
        )}
        {phase >= 3 && <Badge tone="yes" className={cn(animate && "animate-pop")} />}
      </span>
    </span>
  )
}

function MiniPhoto({ who, look, className }: { who: "kamu" | "dia"; look: number; className?: string }) {
  return (
    <span className={cn("relative overflow-hidden", className)} style={{ background: LOOKS[look][who === "kamu" ? 0 : 1] }}>
      <Figure who={who} pose="diam" className="absolute inset-x-0 bottom-0 h-auto w-full" />
    </span>
  )
}

// 0–5 sorotan berpindah dari template ke template · 6 diam
function TemplatesScene({ phase }: { phase: number }) {
  return (
    <span className="relative flex items-end gap-1.5">
      {BUILTIN_TEMPLATES.map((t, i) => (
        <span
          key={t.id}
          className="block transition-transform duration-300 ease-out"
          style={{ transform: phase === i ? "translateY(-8px) scale(1.12)" : undefined }}
        >
          <Strip
            template={t}
            tokens={TOKENS}
            shadow="strip"
            className="w-[22px] transition-[rotate] duration-300"
            style={{ rotate: phase === i ? "0deg" : `${MINI_TILTS[i]}deg` }}
            renderHalf={(slot, side) => <FrameFill source={DEMO_FRAMES[slot][side]} side={side} />}
          />
        </span>
      ))}
    </span>
  )
}

// 0 foto 2 kosong · 1 tombol ditekan · 2 kilat · 3 foto baru · 4 centang
function RetakeScene({ phase, animate }: { phase: number; animate: boolean }) {
  const filled = phase >= 3
  return (
    <span className="relative flex items-center gap-3">
      <span className="relative">
        <Strip
          template={getTemplate("film")}
          tokens={TOKENS}
          shadow="strip"
          className="w-[46px] -rotate-3"
          slotClassName={(slot) => (slot === 1 && !filled ? "outline-2 outline-shutter" : undefined)}
          renderHalf={(slot, side) =>
            slot === 1 && !filled ? (
              <span className={cn("absolute inset-0", phase === 2 ? "animate-flash bg-kertas" : "bg-darkroom-2")} />
            ) : (
              <span className="absolute inset-0">
                <FrameFill source={DEMO_FRAMES[slot][side]} side={side} />
                {slot === 1 && animate && phase === 3 && <span className="absolute inset-0 animate-develop bg-darkroom" />}
              </span>
            )
          }
        />
        {phase >= 4 && <Badge tone="yes" className={cn(animate && "animate-pop")} />}
      </span>
      <span
        className={cn(
          "flex items-center gap-1.5 rounded-full bg-darkroom px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-kertas transition-transform duration-150",
          phase === 1 && "scale-90"
        )}
      >
        <RotateCcwIcon className={cn("size-3 transition-transform duration-500", phase >= 1 && phase <= 3 && "-rotate-180")} />
        Ulang foto 2
      </span>
    </span>
  )
}

function Badge({ tone, className }: { tone: "yes" | "no"; className?: string }) {
  return (
    <span
      className={cn(
        "absolute -top-2 -right-2 flex size-[18px] items-center justify-center rounded-full text-kertas",
        tone === "yes" ? "bg-ok" : "bg-grain",
        className
      )}
    >
      {tone === "yes" ? <CheckIcon className="size-2.5" strokeWidth={3.5} /> : <XIcon className="size-2.5" strokeWidth={3.5} />}
    </span>
  )
}
