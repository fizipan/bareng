"use client"

import { useState, type PointerEvent as ReactPointerEvent } from "react"
import { Strip } from "@/components/strip/strip"
import { SITE_HOST } from "@/lib/brand"
import { getTemplate } from "@/lib/templates/builtin"
import { cn } from "@/lib/utils"
import { FigureFill } from "./figure"
import { liveProps, useFinePointer, useInView, useLookAt, useReducedMotion } from "./motion"

// Strip asli (renderer yang sama dengan hasil akhir) seperti hasil cetak di
// meja: jatuh satu per satu saat terlihat, terangkat saat disentuh/disorot,
// dan sedikit bergeser mengikuti kursor (lapisan depan-belakang).
const SHOWCASE = [
  { id: "film", tilt: -2, depth: 10 },
  { id: "kodak", tilt: 1, depth: 18 },
  { id: "valentine", tilt: 3, depth: 10 },
]

export function TemplateTray() {
  const reduced = useReducedMotion()
  const fine = useFinePointer()
  const [ref, inView] = useInView<HTMLDivElement>(0.3)
  const [seen, setSeen] = useState(false)
  const [lifted, setLifted] = useState<number | null>(null)
  if (inView && !seen) setSeen(true)
  useLookAt(ref, fine && !reduced)

  const parallax = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!fine || reduced) return
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty("--px", String(((e.clientX - r.left) / r.width) * 2 - 1))
    e.currentTarget.style.setProperty("--py", String(((e.clientY - r.top) / r.height) * 2 - 1))
  }
  const still = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty("--px", "0")
    e.currentTarget.style.setProperty("--py", "0")
    setLifted(null)
  }

  return (
    <div
      ref={ref}
      {...liveProps(inView)}
      onPointerMove={parallax}
      onPointerLeave={still}
      className="relative overflow-hidden rounded-md bg-card px-4 pt-6 pb-4 @3xl:px-10 @3xl:pt-12 @3xl:pb-8"
    >
      <span aria-hidden className="absolute inset-0 bg-dots [--dots-color:#D5D2C9]" />
      <div className="relative grid grid-cols-3 items-end justify-items-center gap-x-3 gap-y-3 @3xl:mx-auto @3xl:max-w-[640px] @3xl:gap-x-10 @3xl:gap-y-5">
        {SHOWCASE.map(({ id, tilt, depth }, i) => {
          const up = lifted === i
          return (
            <button
              key={id}
              type="button"
              aria-label={`Contoh template ${getTemplate(id).name}`}
              aria-pressed={up}
              onClick={() => setLifted(up ? null : i)}
              onPointerEnter={(e) => e.pointerType === "mouse" && setLifted(i)}
              className={cn(
                "w-full max-w-[112px] cursor-pointer rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 @3xl:max-w-[168px]",
                seen ? "animate-drop" : "opacity-0",
                reduced && "opacity-100"
              )}
              style={{ animationDelay: `${i * 140}ms` }}
            >
              <span
                className="block transition-transform duration-300 ease-out"
                style={{
                  transform: `translate(calc(var(--px, 0) * ${depth}px), calc(var(--py, 0) * ${depth * 0.6}px))`,
                }}
              >
                <span
                  className="block transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)]"
                  style={{ transform: up ? "translateY(-14px) rotate(0deg) scale(1.06)" : `rotate(${tilt}deg)` }}
                >
                  <Strip
                    template={getTemplate(id)}
                    tokens={{ date: "14.02.27", host: SITE_HOST }}
                    shadow="strip"
                    className={cn("w-full transition-shadow duration-300", up && "shadow-[0_22px_34px_rgb(22_20_29/0.24)]")}
                    renderHalf={(slot, side) => <FigureFill slot={slot} side={side} set={i} />}
                  />
                </span>
              </span>
            </button>
          )
        })}
        {SHOWCASE.map(({ id }, i) => {
          const t = getTemplate(id)
          return (
            <span
              key={id}
              className={cn(
                "flex flex-wrap items-center justify-center gap-1.5 self-start text-center text-caption transition-colors duration-200 @3xl:text-small",
                lifted === i ? "font-semibold text-foreground" : "text-soft-foreground"
              )}
            >
              {t.name}
              {t.tier === "premium" && (
                <span className="rounded-sm bg-flash px-1.5 py-px text-[10px] font-semibold text-darkroom">Premium</span>
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}
