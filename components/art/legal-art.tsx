"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Figure, FigureFill } from "./figure"
import { liveProps, useInView, useReducedMotion } from "./motion"

// Privasi: photostrip kalian di dalam amplop bersegel hati. Ketuk (atau hover)
// = strip mengintip sebentar, lalu masuk lagi.
export function SealedStrip({ className }: { className?: string }) {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLSpanElement>(0.1)
  const [peek, setPeek] = useState(false)
  const timer = useRef<number>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const open = () => {
    if (reduced) return
    setPeek(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setPeek(false), 1500)
  }

  return (
    <span
      ref={ref}
      aria-hidden
      {...liveProps(inView)}
      onPointerDown={open}
      className={cn("group relative block aspect-[5/6] w-full cursor-pointer select-none", className)}
    >
      <span className="absolute inset-0 animate-float">
        <svg viewBox="0 0 100 120" className="absolute inset-0 size-full">
          <path d="M6 50 L50 18 L94 50 Z" fill="#D3D0C7" />
          <rect x="6" y="48" width="88" height="64" rx="6" fill="#DCD9D1" />
        </svg>
        <span
          className={cn(
            "absolute top-[10%] left-[29%] w-[42%] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-[16%]",
            peek && "-translate-y-[16%]"
          )}
        >
          <span className="flex -rotate-3 flex-col gap-[4%] bg-white px-[6%] pt-[6%] pb-[16%] shadow-strip">
            {[0, 1, 2].map((slot) => (
              <span key={slot} className="relative flex aspect-[2/1] gap-px">
                {(["a", "b"] as const).map((side) => (
                  <span key={side} className="relative flex-1 overflow-hidden">
                    <FigureFill slot={slot} side={side} set={1} />
                  </span>
                ))}
              </span>
            ))}
          </span>
        </span>
        <svg viewBox="0 0 100 120" className="absolute inset-0 size-full drop-shadow-[0_6px_10px_rgb(22_20_29/0.12)]">
          <path d="M6 58 L50 86 L94 58 V106 Q94 112 88 112 H12 Q6 112 6 106 Z" fill="#F4F3EF" />
          <path d="M6 58 L50 86 L94 58" fill="none" stroke="#C9C6BE" strokeWidth="1" strokeLinejoin="round" />
          <circle cx="50" cy="86" r="9.5" fill="#E4462E" />
          <path d="M50 91 C44.5 87 45 81.5 48 81.5 C49.3 81.5 50 82.6 50 83.4 C50 82.6 50.7 81.5 52 81.5 C55 81.5 55.5 87 50 91 Z" fill="#F4F3EF" />
        </svg>
      </span>
    </span>
  )
}

// Ketentuan: tiket booth "1 room untuk kalian berdua", sudah dicap SAH.
// Ketuk = dicap ulang.
export function BoothTicket({ className }: { className?: string }) {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLSpanElement>(0.1)
  const [stamp, setStamp] = useState(0)

  return (
    <span
      ref={ref}
      aria-hidden
      {...liveProps(inView)}
      onPointerDown={() => !reduced && setStamp((n) => n + 1)}
      className={cn("relative block aspect-[8/6] w-full cursor-pointer select-none", className)}
    >
      <span className="absolute inset-0 flex animate-float items-center">
        <svg viewBox="0 0 160 100" className="w-full -rotate-6 drop-shadow-[0_8px_12px_rgb(22_20_29/0.14)]">
          <path
            d="M8 10 H108 A6 6 0 0 0 120 10 H152 A4 4 0 0 1 156 14 V86 A4 4 0 0 1 152 90 H120 A6 6 0 0 0 108 90 H8 A4 4 0 0 1 4 86 V14 A4 4 0 0 1 8 10 Z"
            fill="#FFFFFF"
          />
          <line x1="114" y1="20" x2="114" y2="80" stroke="#C9C6BE" strokeWidth="1.2" strokeDasharray="3 3" />
          <rect x="16" y="20" width="4" height="12" rx="1" fill="#E4462E" />
          <rect x="21.5" y="20" width="4" height="12" rx="1" fill="#FFD23F" />
          <rect x="27" y="20" width="4" height="12" rx="1" fill="#16141D" />
          <g fontFamily="var(--font-bricolage), sans-serif" fill="#16141D">
            <text x="16" y="55" fontSize="19" fontWeight="800">
              1 room
            </text>
            <text x="16" y="70" fontSize="8.5" fill="#5F5D69" fontFamily="var(--font-inter), sans-serif">
              untuk kalian berdua
            </text>
            <text x="135" y="54" fontSize="20" fontWeight="800" textAnchor="middle">
              ×2
            </text>
            <text x="135" y="67" fontSize="7.5" textAnchor="middle" fill="#5F5D69" fontFamily="var(--font-inter), sans-serif">
              orang
            </text>
          </g>
          <g key={stamp} className={cn(stamp > 0 && "animate-pop")} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
            <g transform="rotate(-14 90 30)" fill="none" stroke="#E4462E" opacity="0.9">
              <circle cx="90" cy="30" r="14" strokeWidth="2" />
              <circle cx="90" cy="30" r="10.5" strokeWidth="0.8" strokeDasharray="2 1.6" />
              <text
                x="90"
                y="33"
                fontSize="8.5"
                fontWeight="800"
                textAnchor="middle"
                fill="#E4462E"
                stroke="none"
                letterSpacing="0.6"
                fontFamily="var(--font-bricolage), sans-serif"
              >
                SAH
              </text>
            </g>
          </g>
        </svg>
      </span>
    </span>
  )
}

// Bantuan: kamu melambai dengan gelembung "?" — ketuk = gelembungnya meloncat.
export function HelpBubble({ className }: { className?: string }) {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLSpanElement>(0.1)
  const [bounce, setBounce] = useState(0)

  return (
    <span
      ref={ref}
      aria-hidden
      {...liveProps(inView)}
      onPointerDown={() => !reduced && setBounce((n) => n + 1)}
      className={cn("relative block aspect-square w-full cursor-pointer select-none", className)}
    >
      <span className="absolute inset-x-[8%] bottom-0 animate-float">
        <Figure who="kamu" pose="lambai" className="h-auto w-full" />
      </span>
      <span
        key={bounce}
        className={cn(
          "absolute top-[2%] right-0 grid size-[42%] place-items-center rounded-full rounded-bl-[6px] bg-darkroom font-display text-[clamp(18px,4cqw,34px)] font-extrabold text-flash shadow-[0_8px_16px_rgb(22_20_29/0.18)]",
          bounce > 0 && "animate-pop"
        )}
      >
        ?
      </span>
    </span>
  )
}
