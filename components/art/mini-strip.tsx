"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { FigureFill } from "./figure"
import { useReducedMotion } from "./motion"

// Strip mini melayang (kartu "Ada yang ngajak kamu foto bareng?"). Ketuk =
// cetakan lain dengan pose berbeda.
export function MiniStrip({ className }: { className?: string }) {
  const reduced = useReducedMotion()
  const [take, setTake] = useState(0)

  return (
    <span
      aria-hidden
      onPointerDown={() => !reduced && setTake((n) => n + 1)}
      className={cn("block shrink-0 cursor-pointer animate-float", className)}
    >
      <span
        key={take}
        className={cn("flex w-[60px] -rotate-5 flex-col gap-[3px] bg-kertas px-1 pt-1 pb-[11px] shadow-strip", take > 0 && "animate-pop")}
      >
        {[0, 1, 3].map((slot) => (
          <span key={slot} className="relative flex h-6 gap-px">
            {(["a", "b"] as const).map((side) => (
              <span key={side} className="relative flex-1 overflow-hidden">
                <FigureFill slot={slot} side={side} set={take} />
              </span>
            ))}
          </span>
        ))}
      </span>
    </span>
  )
}
