"use client"

import { useState, type CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { Figure } from "./figure"
import { liveProps, useInView, useReducedMotion } from "./motion"

// Photostrip yang hilang (404, dihapus, kedaluwarsa): strip kosong bergaris
// putus-putus, kamu & dia bergantian mengintip kebingungan. Ketuk = mereka
// melompat kaget.
export function LostStrip({ className }: { className?: string }) {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLSpanElement>(0.2)
  const [hop, setHop] = useState(0)

  return (
    <span
      ref={ref}
      aria-hidden
      {...liveProps(inView)}
      onPointerDown={() => !reduced && setHop((n) => n + 1)}
      className={cn("relative flex h-[172px] w-[230px] cursor-pointer items-end justify-center", className)}
    >
      <span
        key={`kamu-${hop}`}
        className={cn("absolute bottom-3 left-5", hop > 0 ? "animate-hop" : "animate-peek")}
        style={{ "--look-x": 0.9 } as CSSProperties}
      >
        <Figure who="kamu" pose="kaget" className="size-[68px]" />
      </span>
      <span
        key={`dia-${hop}`}
        className={cn("absolute right-5 bottom-3", hop > 0 ? "animate-hop [animation-delay:90ms]" : "animate-peek [animation-delay:1.6s]")}
        style={{ "--look-x": -0.9 } as CSSProperties}
      >
        <Figure who="dia" pose="kaget" className="size-[68px]" blinkDelay={500} />
      </span>
      <span className="relative z-10 mb-1 flex w-[88px] -rotate-3 flex-col gap-1.5 bg-white px-2 pt-2 pb-5 shadow-strip">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="grid h-[27px] place-items-center rounded-[2px] border-[1.5px] border-dashed border-outline">
            <span className="font-display text-[11px] font-bold text-grain">?</span>
          </span>
        ))}
        <span className="absolute bottom-1.5 left-2 font-display text-[8px] font-semibold text-muted-foreground">??.??.??</span>
      </span>
    </span>
  )
}
