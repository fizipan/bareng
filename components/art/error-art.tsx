"use client"

import { useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react"
import { XIcon } from "lucide-react"
import type { ErrorKind } from "@/lib/content/errors"
import { cn } from "@/lib/utils"
import { Figure, GhostFigure } from "./figure"
import { Lens } from "./lens"
import { glance, liveProps, useFinePointer, useInView, useLookAt, useReducedMotion } from "./motion"

// Ilustrasi state error (PRD §15.5) yang hidup: tiap jenis punya adegan kecil
// yang menjelaskan apa yang terjadi. Ketuk = putar ulang; mata tokoh ikut kursor.
export function ErrorArt({ kind }: { kind: ErrorKind }) {
  const reduced = useReducedMotion()
  const fine = useFinePointer()
  const [ref, inView] = useInView<HTMLDivElement>(0.2)
  const [run, setRun] = useState(0)
  useLookAt(ref, fine && !reduced && kind !== "penuh")

  if (kind === "camera") return <Lens size={104} blocked />

  const tap = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduced) return
    if (!fine && kind !== "penuh") glance(e.currentTarget, e.clientX, e.clientY)
    setRun((n) => n + 1)
  }

  return (
    <div
      ref={ref}
      aria-hidden
      {...liveProps(inView)}
      onPointerDown={tap}
      className="absolute inset-0 grid cursor-pointer place-items-center"
      // Room penuh: dua orang di booth menoleh ke orang ketiga.
      style={kind === "penuh" ? ({ "--look-x": 0.9, "--look-y": 0.1 } as CSSProperties) : undefined}
    >
      {kind === "penuh" && <Full key={run} poked={run > 0} />}
      {kind === "putus" && <Disconnected key={run} poked={run > 0} />}
      {kind === "jaringan" && <Offline key={run} poked={run > 0} />}
      {kind === "kadaluarsa" && <Expired key={run} />}
      {kind === "tidak-ada" && <NotFound key={run} />}
    </div>
  )
}

// Booth dua orang sudah penuh; orang ketiga mentok lalu mundur.
function Full({ poked }: { poked: boolean }) {
  return (
    <span className="relative flex items-end gap-4">
      <span className="relative flex items-end gap-0.5 rounded-[12px] border-[1.5px] border-kabin-line px-2 pt-4">
        <Figure who="kamu" pose={poked ? "kaget" : "diam"} className={cn("h-16 w-16", poked && "animate-hop")} />
        <Figure who="dia" pose={poked ? "kaget" : "diam"} className={cn("h-16 w-16", poked && "animate-hop")} blinkDelay={400} />
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-darkroom px-2 py-px text-[10px] font-semibold text-kabin-soft">
          2/2
        </span>
      </span>
      <span className="relative animate-squeeze text-grain">
        <GhostFigure className="h-16 w-16" />
        <span className="absolute -top-1 right-1 grid size-5 animate-nope place-items-center rounded-full bg-shutter text-kertas">
          <XIcon className="size-3" strokeWidth={3} />
        </span>
      </span>
    </span>
  )
}

function Phone({ dashed, children }: { dashed?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "relative flex h-[86px] w-[54px] items-end justify-center overflow-hidden rounded-[10px] border-2 p-1",
        dashed ? "border-dashed border-grain text-grain" : "border-kertas bg-darkroom-2"
      )}
    >
      {children}
    </span>
  )
}

// Sinyal berjalan dari HP kamu, putus di tengah, mencoba lagi.
function Disconnected({ poked }: { poked: boolean }) {
  return (
    <span className="relative flex items-center gap-3">
      <Phone>
        <Figure who="kamu" pose="kaget" className="h-auto w-full" />
      </Phone>
      <span className="flex items-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn("size-1.5 animate-signal rounded-full", i === 2 ? "bg-shutter" : "bg-flash")}
            style={{ animationDelay: `${i * 160}ms`, animationDuration: poked ? "700ms" : undefined }}
          />
        ))}
      </span>
      <Phone dashed>
        <GhostFigure className="h-auto w-full" />
      </Phone>
    </span>
  )
}

// Wifi mencoba menyala satu per satu, lalu padam lagi.
function Offline({ poked }: { poked: boolean }) {
  const speed = poked ? "800ms" : undefined
  return (
    <span className="relative flex items-end gap-3">
      <Figure who="kamu" pose="kaget" className="h-[72px] w-[72px]" />
      <svg viewBox="0 0 48 40" className="mb-3 w-16" fill="none" strokeLinecap="round">
        {[
          "M4 16 a28 28 0 0 1 40 0",
          "M11 23 a18 18 0 0 1 26 0",
          "M18 30 a8 8 0 0 1 12 0",
        ].map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="#F4F3EF"
            strokeWidth="3.5"
            className="animate-signal"
            style={{ animationDelay: `${(2 - i) * 220}ms`, animationDuration: speed }}
          />
        ))}
        <circle cx="24" cy="36" r="3" fill="#E4462E" className="animate-blink" />
      </svg>
    </span>
  )
}

// Jam berputar cepat lalu berhenti di 15 menit, tertidur.
function Expired() {
  return (
    <span className="relative grid size-[104px] place-items-center rounded-full border-2 border-grain">
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} className="absolute inset-1.5" style={{ rotate: `${i * 30}deg` }}>
          <span className={cn("absolute top-0 left-1/2 w-[2px] -translate-x-1/2 rounded bg-kabin-line", i % 3 === 0 ? "h-2.5" : "h-1.5")} />
        </span>
      ))}
      {/* Jarum jam (diam) & jarum menit (berputar lalu berhenti). */}
      <span className="absolute inset-0" style={{ rotate: "-30deg" }}>
        <span className="absolute top-[26px] left-1/2 h-[26px] w-[3px] -translate-x-1/2 rounded-[2px] bg-shutter" />
      </span>
      <span className="absolute inset-0 animate-clock">
        <span className="absolute top-[14px] left-1/2 h-[38px] w-[3px] -translate-x-1/2 rounded-[2px] bg-kertas" />
      </span>
      <span className="size-2 rounded-full bg-kertas" />
      <span className="absolute -top-1 -right-3 animate-zz font-display text-small font-bold text-flash">z</span>
      <span className="absolute -top-4 right-1 animate-zz font-display text-caption font-bold text-flash [animation-delay:350ms]">z</span>
    </span>
  )
}

// Kaca pembesar menyisir kotak kode, tidak menemukan apa-apa.
function NotFound() {
  return (
    <span className="relative flex flex-col items-center">
      <span className="flex gap-1.5">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="grid h-11 w-8 place-items-center rounded-[5px] bg-darkroom-2 font-display text-lg font-semibold text-kabin-line">
            ?
          </span>
        ))}
      </span>
      <span className="absolute -top-3 left-[calc(50%-26px)] animate-search">
        <span className="relative block size-[52px]">
          <span className="absolute inset-0 rounded-full border-[3.5px] border-kertas bg-kertas/10" />
          <span className="absolute -right-2 -bottom-3 h-5 w-[5px] -rotate-45 rounded-full bg-kertas" />
        </span>
      </span>
    </span>
  )
}
