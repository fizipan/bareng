"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "./motion"

// "Masuk ke booth…": bilik photobooth mini, tirai bergoyang, dua pasang kaki
// (kamu merah, dia kuning) di bawah tirai, lampu kilat berkedip. Ketuk = kilat.
export function BoothLoader({ className }: { className?: string }) {
  const reduced = useReducedMotion()
  const [flash, setFlash] = useState(0)

  return (
    <span
      aria-hidden
      onPointerDown={() => !reduced && setFlash((n) => n + 1)}
      className={cn("relative flex h-[132px] w-[108px] cursor-pointer flex-col items-center", className)}
    >
      {/* Papan nama + lampu kilat */}
      <span className="relative z-10 flex h-5 w-[92px] items-center justify-between rounded-t-[8px] bg-shutter px-2">
        <span className="font-display text-[9px] font-extrabold tracking-[0.12em] text-kertas">FOTO</span>
        <span className="size-2 animate-blink rounded-full bg-flash" />
      </span>
      {/* Bilik */}
      <span className="relative flex h-[104px] w-[108px] justify-center overflow-hidden rounded-[10px] bg-darkroom-2 pt-2">
        <span className="relative h-[74px] w-[70px] overflow-hidden rounded-t-[4px] bg-[#141220]">
          {/* Tirai */}
          <span className="absolute inset-x-0 top-0 h-[60px] origin-top animate-curtain bg-[repeating-linear-gradient(90deg,#E4462E_0_7px,#CC3A25_7px_14px)]" />
          {/* Kaki kamu & dia di bawah tirai */}
          <span className="absolute bottom-1 left-2.5 flex gap-1">
            <span className="h-2.5 w-2 animate-[hop_1.4s_ease-in-out_infinite] rounded-t-[3px] rounded-b-[1px] bg-shutter" />
            <span className="h-2.5 w-2 animate-[hop_1.4s_ease-in-out_0.2s_infinite] rounded-t-[3px] rounded-b-[1px] bg-shutter" />
          </span>
          <span className="absolute right-2.5 bottom-1 flex gap-1">
            <span className="h-2.5 w-2 animate-[hop_1.4s_ease-in-out_0.5s_infinite] rounded-t-[3px] rounded-b-[1px] bg-flash" />
            <span className="h-2.5 w-2 animate-[hop_1.4s_ease-in-out_0.7s_infinite] rounded-t-[3px] rounded-b-[1px] bg-flash" />
          </span>
        </span>
        {/* Slot keluarnya strip */}
        <span className="absolute bottom-3 h-1.5 w-12 rounded-full bg-darkroom" />
      </span>
      {flash > 0 && <span key={flash} className="absolute -inset-3 animate-flash rounded-[16px] bg-kertas" />}
    </span>
  )
}
