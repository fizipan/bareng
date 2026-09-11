"use client"

import { useEffect, useEffectEvent, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { LOOKS } from "@/lib/templates/placeholder"
import { cn } from "@/lib/utils"
import { Figure, type Pose } from "./figure"
import { liveProps, useFinePointer, useInView, useLookAt, useReducedMotion } from "./motion"

// Hero: mesin booth mini. Strip keluar dari slot dan foto "tercuci" satu per
// satu; tombol shutter memutar hitung mundur → kilat → cetakan baru dengan
// pose lain. Mata tokoh mengikuti kursor, strip miring mengikuti pointer.
// Foto terakhir selalu hati yang dibentuk berdua (separuh di tiap foto).
const TAKES: Pose[][] = [
  ["diam", "miring", "peace", "hati"],
  ["kaget", "peace", "miring", "hati"],
  ["miring", "kaget", "diam", "hati"],
]

type Stage = "idle" | "count" | "flash"

const clamp = (v: number) => Math.max(-1, Math.min(1, v))

export function HeroBooth() {
  const reduced = useReducedMotion()
  const fine = useFinePointer()
  const [ref, inView] = useInView<HTMLDivElement>(0.3)
  const [take, setTake] = useState(0)
  const [stage, setStage] = useState<Stage>("idle")
  const [count, setCount] = useState(3)
  const [tried, setTried] = useState(false)
  const timers = useRef(new Set<number>())

  const later = (ms: number, fn: () => void) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id)
      fn()
    }, ms)
    timers.current.add(id)
  }

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const shoot = () => {
    if (stage !== "idle") return
    if (reduced) {
      setTake((t) => t + 1)
      return
    }
    setStage("count")
    setCount(3)
    later(700, () => setCount(2))
    later(1400, () => setCount(1))
    later(2100, () => {
      setStage("flash")
      setTake((t) => t + 1) // cetakan baru muncul di balik kilat
    })
    later(2300, () => setStage("idle"))
  }

  // Satu contoh otomatis kalau pengunjung belum mencoba sendiri.
  const autoShoot = useEffectEvent(() => {
    if (!tried && take === 0) shoot()
  })
  useEffect(() => {
    if (!inView || tried || reduced || take > 0) return
    const t = window.setTimeout(autoShoot, 4200)
    return () => clearTimeout(t)
  }, [inView, tried, reduced, take])

  // Mata ikut kursor di seluruh halaman (mouse saja).
  useLookAt(ref, fine && !reduced)

  const tilt = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!fine || reduced) return
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty("--tilt-x", String(clamp(((e.clientX - r.left) / r.width) * 2 - 1)))
    e.currentTarget.style.setProperty("--tilt-y", String(clamp(((e.clientY - r.top) / r.height) * 2 - 1)))
  }
  const untilt = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty("--tilt-x", "0")
    e.currentTarget.style.setProperty("--tilt-y", "0")
  }
  // Layar sentuh: tokoh melirik ke titik yang diketuk, lalu kembali.
  const glance = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (fine || reduced) return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty("--look-x", String(clamp((e.clientX - (r.left + r.width / 2)) / 120)))
    el.style.setProperty("--look-y", String(clamp((e.clientY - (r.top + r.height * 0.45)) / 120)))
    later(1400, () => {
      el.style.setProperty("--look-x", "0")
      el.style.setProperty("--look-y", "0")
    })
  }

  const press = () => {
    setTried(true)
    shoot()
  }

  return (
    <div
      ref={ref}
      {...liveProps(inView)}
      onPointerMove={tilt}
      onPointerLeave={untilt}
      onPointerDown={glance}
      className="relative flex justify-center pt-[22px] pb-2.5 select-none @3xl:py-10"
    >
      <div aria-hidden className="absolute inset-0 bg-dots [--dots-color:#D5D2C9] [mask-image:radial-gradient(circle_at_50%_45%,#000_0%,#000_52%,transparent_76%)]" />
      <div aria-hidden className="absolute top-[26px] left-1/2 size-[236px] -translate-x-1/2 rounded-full border-[1.5px] border-line @3xl:top-1/2 @3xl:size-[320px] @3xl:-translate-y-1/2" />

      <div aria-hidden className="relative flex origin-top flex-col items-center @3xl:scale-[1.3]" onClick={press}>
        {/* Slot mesin booth */}
        <span className="relative z-10 flex h-3 w-[214px] items-center justify-end rounded-full bg-darkroom px-2.5">
          <span className={cn("size-1.5 rounded-full", stage === "idle" ? "bg-ok" : "animate-blink bg-shutter")} />
        </span>
        {/* Kertas keluar dari slot; miring mengikuti pointer, berayun pelan */}
        <div className="-mt-1.5 cursor-pointer overflow-hidden px-4 pb-7">
          <div
            className="transition-transform duration-300 ease-out"
            style={{
              transform:
                "perspective(800px) rotateX(calc(var(--tilt-y, 0) * -7deg)) rotateY(calc(var(--tilt-x, 0) * 9deg))",
            }}
          >
            <div className="origin-top animate-sway">
              <HeroStrip key={take} poses={TAKES[take % TAKES.length]} print={!reduced} />
            </div>
          </div>
        </div>
        {stage === "count" && (
          <span className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center pb-6">
            <span
              key={count}
              className="animate-count font-display text-[96px] leading-none font-extrabold text-flash [text-shadow:0_4px_0_#16141D,0_0_28px_rgb(22_20_29/0.4)]"
            >
              {count}
            </span>
          </span>
        )}
      </div>

      <span
        aria-hidden
        className="absolute top-9 right-1.5 animate-wobble rounded-full bg-flash px-3 py-2 font-display text-small font-semibold text-darkroom @3xl:top-12 @3xl:right-10"
      >
        90 detik
      </span>

      <div className="absolute right-0 bottom-3 z-20 flex flex-col items-center gap-1 @3xl:right-6 @3xl:bottom-12">
        <span aria-hidden className="flex -rotate-6 items-end gap-0.5 font-display text-caption font-semibold text-soft-foreground">
          Coba jepret!
          <svg viewBox="0 0 24 24" className="size-4 translate-y-1 text-grain" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 5c7 0 12 4 12 12" />
            <path d="M12 14l4 4 3-5" />
          </svg>
        </span>
        <button
          type="button"
          onClick={press}
          disabled={stage !== "idle"}
          aria-label="Coba jepret: hitung mundur lalu cetak photostrip contoh"
          className="relative grid size-16 cursor-pointer place-items-center rounded-full bg-white shadow-strip outline-none transition-transform duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95 disabled:cursor-default"
        >
          {!tried && stage === "idle" && <span aria-hidden className="absolute inset-0 animate-ping-ring rounded-full bg-shutter" />}
          <span
            aria-hidden
            className={cn(
              "relative size-12 rounded-full bg-shutter transition-transform duration-150",
              stage === "count" && "scale-90"
            )}
          />
        </button>
      </div>

      {stage === "flash" && <span aria-hidden className="pointer-events-none absolute inset-0 z-30 animate-flash rounded-md bg-white" />}
    </div>
  )
}

function HeroStrip({ poses, print }: { poses: Pose[]; print: boolean }) {
  return (
    <div className={cn("relative flex w-[186px] flex-col gap-2 rounded-b-[2px] bg-white px-4 pt-2.5 pb-[34px] shadow-strip", print && "animate-print")}>
      <span className="absolute inset-y-0 left-1 w-[5px] bg-[repeating-linear-gradient(180deg,#DCD9D1_0_7px,transparent_7px_17px)]" />
      <span className="absolute inset-y-0 right-1 w-[5px] bg-[repeating-linear-gradient(180deg,#DCD9D1_0_7px,transparent_7px_17px)]" />
      {poses.map((pose, i) => (
        <span key={i} className="relative flex h-[74px] gap-0.5">
          {(["kamu", "dia"] as const).map((who, j) => (
            <span key={who} className="relative flex-1 overflow-hidden" style={{ background: LOOKS[i % LOOKS.length][j] }}>
              <Figure who={who} pose={pose} blinkDelay={i * 700 + j * 300} className="absolute inset-x-0 bottom-0 h-auto w-full" />
            </span>
          ))}
          {/* Foto "tercuci" satu per satu setelah kertas keluar. */}
          {print && (
            <span className="absolute inset-0 animate-develop bg-darkroom" style={{ animationDelay: `${650 + i * 280}ms` }} />
          )}
        </span>
      ))}
      <span className="absolute bottom-[11px] left-4 font-display text-meta font-semibold text-darkroom">14.02.27</span>
      <span className="absolute right-4 bottom-[11px] font-display text-[10px] font-semibold text-darkroom">bareng.</span>
    </div>
  )
}
