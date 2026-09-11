"use client"

import { useState } from "react"
import { CheckCheckIcon, CheckIcon } from "lucide-react"
import { LOOKS } from "@/lib/templates/placeholder"
import { cn } from "@/lib/utils"
import { Figure } from "./figure"
import { liveProps, useFinePointer, useInView, useLookAt, useReducedMotion, useTimeline } from "./motion"

const STEPS = [
  { title: "Buat room", desc: "Sekali ketuk, dapat link dan kode enam huruf." },
  { title: "Kirim ke dia", desc: "Lewat WhatsApp. Dia tinggal klik, nggak perlu daftar." },
  { title: "Hitung mundur bareng", desc: "Empat foto, satu photostrip, langsung bisa diunduh." },
]

// Durasi tiap fase per adegan (ms); fase terakhir = tahan sebelum lanjut.
const TIMELINES = [
  [650, 350, 900, 450, 1700],
  [900, 650, 650, 900, 650, 550, 1700],
  [700, 700, 700, 700, 200, 950, 1500],
] as const
// Gambar diam (tidak diputar / reduced motion): momen yang paling bercerita.
const STILL = [4, 6, 1]

const DEMO_CODE = "K7M2QX"

// Tiga langkah diputar bergantian seperti cerita: bikin room → kirim link →
// hitung mundur. Kartu yang aktif disorot; ketuk kartu untuk memutar ulang.
export function HowItWorksSteps() {
  const reduced = useReducedMotion()
  const fine = useFinePointer()
  const [ref, inView] = useInView<HTMLOListElement>(0.3)
  const [active, setActive] = useState(0)
  const [run, setRun] = useState(0)
  const playing = !!inView && !reduced
  useLookAt(ref, fine && !reduced)

  const play = (i: number) => {
    setActive(i)
    setRun((r) => r + 1)
  }

  return (
    <ol ref={ref} {...liveProps(inView)} className="grid gap-3 @3xl:grid-cols-3 @3xl:gap-6">
      {STEPS.map((step, i) => {
        const on = playing && active === i
        return (
          <li
            key={step.title}
            className={cn(
              "flex flex-col gap-4 rounded-md bg-card p-3 pb-5 outline-2 -outline-offset-2 transition-[outline-color] duration-300 @3xl:gap-5 @3xl:pb-6",
              on ? "outline-shutter" : "outline-transparent"
            )}
          >
            <button
              type="button"
              onClick={() => play(i)}
              aria-label={`Putar contoh langkah ${i + 1}: ${step.title}`}
              className="relative flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-[10px] bg-darkroom text-kertas outline-none focus-visible:ring-3 focus-visible:ring-ring/50 @3xl:h-44"
            >
              <span aria-hidden className="absolute inset-0 bg-dots [--dots-color:rgb(244_243_239/0.06)]" />
              {on ? (
                <Scene key={`play-${run}`} step={i} animate onDone={() => play((i + 1) % STEPS.length)} />
              ) : (
                <SceneFrame step={i} phase={STILL[i]} animate={false} />
              )}
            </button>
            <div className="flex items-start gap-3 px-1 @3xl:px-2">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full font-display text-label font-semibold text-kertas transition-colors duration-300",
                  on ? "bg-shutter" : "bg-darkroom"
                )}
              >
                {i + 1}
              </span>
              <span className="flex flex-1 flex-col gap-1">
                <span className="text-body font-semibold">{step.title}</span>
                <span className="text-meta leading-[1.45] text-muted-foreground @3xl:text-small">{step.desc}</span>
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function Scene({ step, animate, onDone }: { step: number; animate: boolean; onDone: () => void }) {
  const phase = useTimeline(TIMELINES[step], onDone)
  return <SceneFrame step={step} phase={phase} animate={animate} />
}

function SceneFrame({ step, phase, animate }: { step: number; phase: number; animate: boolean }) {
  if (step === 0) return <SceneRoom phase={phase} animate={animate} />
  if (step === 1) return <SceneChat phase={phase} animate={animate} />
  return <SceneCount phase={phase} animate={animate} />
}

// 0 tombol · 1 ditekan · 2 kode muncul · 3 "Room dibuat" · 4 tahan
function SceneRoom({ phase, animate }: { phase: number; animate: boolean }) {
  if (phase < 2) {
    return (
      <span aria-hidden className="relative">
        <span
          className={cn(
            "flex items-center gap-2 rounded-full bg-shutter py-2.5 pr-4 pl-3 text-caption font-semibold text-kertas transition-transform duration-150",
            phase === 1 && "scale-95"
          )}
        >
          <span className="size-3 rounded-full bg-kertas/90" />
          Mulai foto bareng
        </span>
        <span
          className={cn(
            "absolute -right-2 -bottom-3 size-7 rounded-full border-2 border-kertas/80 bg-kertas/25 transition-[opacity,transform] duration-300 ease-out",
            phase === 0 ? "translate-x-4 translate-y-4 opacity-0" : "scale-90 opacity-100"
          )}
        />
      </span>
    )
  }
  return (
    <span aria-hidden className="relative flex flex-col items-center gap-3">
      <span className={cn("text-caption text-grain", animate && "animate-fade-in")}>Kode room</span>
      <span className="flex gap-1.5">
        {DEMO_CODE.split("").map((ch, i) => (
          <span
            key={i}
            className={cn(
              "flex h-11 w-8 items-center justify-center rounded-[5px] bg-darkroom-2 font-display text-lg font-semibold",
              animate && "animate-flip-in"
            )}
            style={animate ? { animationDelay: `${i * 90}ms` } : undefined}
          >
            {ch}
          </span>
        ))}
      </span>
      <span
        className={cn(
          "flex items-center gap-1.5 rounded-full bg-darkroom-2 px-2.5 py-1 text-[11px] text-kabin-soft transition-opacity duration-200",
          phase >= 3 ? "opacity-100" : "opacity-0",
          animate && phase >= 3 && "animate-pop"
        )}
      >
        <span className="size-1.5 rounded-full bg-ok" />
        Room dibuat
      </span>
    </span>
  )
}

// 0 aku mengetik · 1 link terkirim · 2 dibaca · 3 dia mengetik · 4 dibalas · 5 "Dimas masuk" · 6 tahan
function SceneChat({ phase, animate }: { phase: number; animate: boolean }) {
  return (
    <span aria-hidden className="absolute inset-0 flex flex-col justify-center gap-2 px-4 pb-8">
      {phase === 0 ? (
        <Typing className="self-end rounded-[14px_14px_4px_14px] bg-ok" />
      ) : (
        <span
          className={cn(
            "max-w-[210px] self-end rounded-[14px_14px_4px_14px] bg-ok px-3 py-2 text-left text-caption leading-snug",
            animate && phase === 1 && "animate-rise"
          )}
        >
          Foto bareng yuk! Klik ini ya: <span className="font-semibold underline">bareng.id/r/{DEMO_CODE}</span>
          <CheckCheckIcon
            className={cn("ml-1 inline size-3.5 align-[-3px] transition-colors duration-300", phase >= 2 ? "text-flash" : "text-kertas/55")}
            strokeWidth={2.5}
          />
        </span>
      )}
      {phase === 3 && <Typing className="self-start rounded-[14px_14px_14px_4px] bg-darkroom-2" />}
      {phase >= 4 && (
        <span
          className={cn(
            "self-start rounded-[14px_14px_14px_4px] bg-darkroom-2 px-3 py-2 text-caption text-kabin-soft",
            animate && phase === 4 && "animate-rise"
          )}
        >
          Oke, aku masuk
        </span>
      )}
      {phase >= 5 && (
        <span
          className={cn(
            "absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-md bg-darkroom-2 py-1.5 pr-3 pl-2 text-[11px] whitespace-nowrap text-kertas shadow-toast",
            animate && phase === 5 && "animate-rise"
          )}
        >
          <span className="flex size-4 items-center justify-center rounded-full bg-ok">
            <CheckIcon className="size-2.5" strokeWidth={3} />
          </span>
          Dimas masuk
        </span>
      )}
    </span>
  )
}

function Typing({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-1 px-3 py-2.5", className)}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-1.5 animate-typing rounded-full bg-kertas" style={{ animationDelay: `${i * 150}ms` }} />
      ))}
    </span>
  )
}

// 0 siap · 1–3 hitung 3-2-1 · 4 kilat · 5 jepret! · 6 tahan
function SceneCount({ phase, animate }: { phase: number; animate: boolean }) {
  const count = phase >= 1 && phase <= 3 ? 4 - phase : null
  const shot = phase >= 5
  return (
    <span aria-hidden className="relative flex flex-col items-center">
      <span className="relative flex gap-1.5 rounded-[4px] outline-2 outline-offset-4 outline-shutter">
        {(["kamu", "dia"] as const).map((who, i) => (
          <span key={who} className="relative h-28 w-20 overflow-hidden rounded-[3px]" style={{ background: LOOKS[i + 1][i] }}>
            <Figure who={who} pose={shot ? "peace" : "diam"} blinkDelay={i * 900} className="absolute inset-x-0 bottom-0 h-auto w-full" />
            <span className="absolute bottom-1 left-1.5 rounded-[3px] bg-darkroom/50 px-1 font-mono text-[9px] text-[#C9C6D4]">{who}</span>
          </span>
        ))}
        {count !== null && (
          <span className="absolute inset-0 flex items-center justify-center bg-darkroom/45">
            <span
              key={count}
              className={cn("font-display text-[60px] leading-none font-extrabold text-flash", animate && "animate-count")}
            >
              {count}
            </span>
          </span>
        )}
        {phase === 4 && <span className="absolute -inset-2 animate-flash rounded-[6px] bg-kertas" />}
      </span>
      {shot && (
        <span
          className={cn(
            "absolute -bottom-7 flex items-center gap-1.5 rounded-full bg-kertas px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-darkroom",
            animate && phase === 5 && "animate-pop"
          )}
        >
          <span className="size-1.5 rounded-full bg-shutter" />
          Jepret! Foto 1 dari 4
        </span>
      )}
    </span>
  )
}
