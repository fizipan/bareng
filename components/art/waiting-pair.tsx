"use client"

import { useState, type PointerEvent as ReactPointerEvent } from "react"
import { cn } from "@/lib/utils"
import { Figure, GhostFigure } from "./figure"
import { glance, liveProps, useFinePointer, useInView, useLookAt, useReducedMotion } from "./motion"

// Kartu "Nunggu dia masuk": kamu melambai di samping siluet kosong; begitu dia
// masuk, dia muncul dan keduanya bergaya. Ketuk = kamu lompat kecil.
export function WaitingPair({ joined, className }: { joined: boolean; className?: string }) {
  const reduced = useReducedMotion()
  const fine = useFinePointer()
  const [ref, inView] = useInView<HTMLSpanElement>(0.2)
  const [hop, setHop] = useState(0)
  useLookAt(ref, fine && !reduced)

  const tap = (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (reduced) return
    if (!fine) glance(e.currentTarget, e.clientX, e.clientY)
    setHop((n) => n + 1)
  }

  return (
    <span
      ref={ref}
      aria-hidden
      {...liveProps(inView)}
      onPointerDown={tap}
      className={cn("relative flex shrink-0 cursor-pointer items-end", className)}
    >
      <span key={`kamu-${hop}`} className={cn(hop > 0 && "animate-hop")}>
        <Figure who="kamu" pose={joined ? "peace" : "lambai"} className="size-12" />
      </span>
      {joined ? (
        <span className="relative animate-pop">
          <Figure who="dia" pose="peace" className="size-12" blinkDelay={600} />
          <svg viewBox="0 0 24 24" className="absolute -top-1 -left-2 size-4 animate-pop text-shutter-soft [animation-delay:250ms]">
            <path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 5 6.4 5c2 0 3.6 1.1 4.6 2.6C12 6.1 13.6 5 15.6 5 19 5 21.1 8.4 19.6 11.8 17.5 16.4 12 21 12 21Z" />
          </svg>
        </span>
      ) : (
        <span className="animate-breathe text-grain">
          <GhostFigure className="size-12" />
        </span>
      )}
    </span>
  )
}
