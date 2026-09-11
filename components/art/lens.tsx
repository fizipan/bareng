"use client"

import { useState, type PointerEvent as ReactPointerEvent } from "react"
import { cn } from "@/lib/utils"
import { glance, liveProps, useFinePointer, useInView, useLookAt, useReducedMotion } from "./motion"

// Lensa kamera yang "hidup": pupil mengikuti kursor (atau titik yang diketuk),
// lensa bernapas pelan, ketuk = fokus (iris menyempit lalu terbuka + kilat).
// `blocked`: kamera dimatikan — dicoret, ketuk = lensa menggeleng.
export function Lens({ size = 150, blocked = false, className }: { size?: number; blocked?: boolean; className?: string }) {
  const reduced = useReducedMotion()
  const fine = useFinePointer()
  const [ref, inView] = useInView<HTMLButtonElement>(0.2)
  const [poke, setPoke] = useState(0)
  useLookAt(ref, fine && !reduced)
  const k = size / 150

  const tap = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (reduced) return
    if (!fine) glance(e.currentTarget, e.clientX, e.clientY)
    setPoke((n) => n + 1)
  }

  return (
    <button
      ref={ref}
      type="button"
      tabIndex={-1}
      aria-hidden
      {...liveProps(inView)}
      onPointerDown={tap}
      className={cn("relative grid shrink-0 cursor-pointer place-items-center outline-none", className)}
      style={{ width: size, height: size }}
    >
      <span
        key={blocked ? `no-${poke}` : "lens"}
        className={cn("relative grid size-full place-items-center", blocked ? poke > 0 && "animate-shake" : "animate-breathe")}
      >
        <span className="absolute inset-0 rounded-full border-2 border-darkroom-2 bg-kabin-sunken" />
        <span className="absolute rounded-full border-[1.5px] border-[#302C3D]" style={{ inset: 16 * k }} />
        <span className="absolute rounded-full border-[1.75px] border-kabin-line bg-[#141220]" style={{ inset: 32 * k }} />
        {/* Pupil + kilau: ikut arah pandang; iris "fokus" saat diketuk. */}
        <span
          className="absolute grid place-items-center transition-transform duration-200 ease-out"
          style={{
            width: 44 * k,
            height: 44 * k,
            transform: `translate(calc(var(--look-x, 0) * ${9 * k}px), calc(var(--look-y, 0) * ${9 * k}px))`,
          }}
        >
          <span
            key={blocked ? "iris" : `iris-${poke}`}
            className={cn("absolute inset-0 rounded-full bg-darkroom-2", !blocked && poke > 0 && "animate-focus")}
          />
          <span className="absolute rounded-full bg-flash" style={{ width: 14 * k, height: 14 * k, left: 1 * k, top: 1 * k }} />
        </span>
        {!blocked && poke > 0 && (
          <span key={`flash-${poke}`} className="absolute inset-0 animate-flash rounded-full bg-kertas/80" />
        )}
        <span
          className="absolute animate-blink rounded-full bg-shutter"
          style={{ width: 10 * k, height: 10 * k, right: 14 * k, bottom: 18 * k }}
        />
        {blocked && (
          <span
            key={`slash-${poke}`}
            className={cn("absolute h-1 -rotate-45 rounded-[2px] bg-shutter", poke > 0 && "animate-pop")}
            style={{ width: 132 * k }}
          />
        )}
      </span>
    </button>
  )
}
