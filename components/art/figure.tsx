import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"

// Tokoh kecil "kamu" (merah, rambut pendek berjambul) & "dia" (kuning, rambut
// panjang berponi + pita), warnanya sama dengan siluet di layar Undang.
// Digambar untuk setengah foto kiri (pasangan di kanan); "dia" dicerminkan.
// Mata mengikuti --look-x/--look-y (-1…1) dari induknya.

export type Pose = "diam" | "miring" | "peace" | "kaget" | "hati" | "lambai"

const COLOR = { kamu: "#E4462E", dia: "#FFD23F" }
const INK = "#16141D"
// Hati yang dibentuk berdua: separuh di foto kamu, separuh di foto dia.
const HEART = "#FF7A64"
const HAIR = "#241F2E"

export function Figure({
  who,
  pose,
  blinkDelay = 0,
  className,
}: {
  who: "kamu" | "dia"
  pose: Pose
  blinkDelay?: number
  className?: string
}) {
  const mirror = who === "dia"
  const lean = pose === "hati" ? 5 : 0
  const tilt = pose === "miring" ? 14 : pose === "hati" ? 8 : 0
  const eyes: CSSProperties = {
    transform: `translate(calc(var(--look-x, 0) * ${mirror ? -1.7 : 1.7}px), calc(var(--look-y, 0) * 1.3px))`,
    transition: "transform 180ms ease-out",
  }

  return (
    <svg viewBox="0 0 60 60" aria-hidden className={cn("block", className)} preserveAspectRatio="xMidYMax meet">
      <g transform={mirror ? "translate(60 0) scale(-1 1)" : undefined}>
        {pose === "hati" && <path d="M60 25 C57 18.5 46.5 19 46.5 27 C46.5 33 53.5 37.5 60 43.5 Z" fill={HEART} />}
        <g transform={`translate(${lean} 0)`} fill={COLOR[who]}>
          {/* Rambut panjang di belakang badan: bahu tetap terlihat. */}
          {who === "dia" && (
            <path
              transform={`rotate(${tilt} 30 37)`}
              d="M17.8 27 C17.2 18 22.6 12.8 30 12.8 C37.4 12.8 42.8 18 42.2 27 L42.8 41.5 C42.9 43.3 41.6 44.6 39.8 44.6 L20.2 44.6 C18.4 44.6 17.1 43.3 17.2 41.5 Z"
              fill={HAIR}
            />
          )}
          <path d="M13 60 V49 a12 12 0 0 1 12 -12 h10 a12 12 0 0 1 12 12 V60 Z" />
          {pose === "lambai" && (
            // Tangan melambai dari bahu (pivot di bahu, dalam koordinat viewBox).
            <g className="animate-wave" style={{ transformBox: "view-box", transformOrigin: "10px 44px" }}>
              <rect x="6.5" y="24" width="6.5" height="21" rx="3.25" />
              <circle cx="9.75" cy="23" r="4" />
            </g>
          )}
          {pose === "peace" && (
            <g>
              <rect x="6" y="27" width="6.5" height="19" rx="3.25" />
              <rect x="5" y="17" width="2.8" height="11" rx="1.4" transform="rotate(-14 6.4 28)" />
              <rect x="9.4" y="17" width="2.8" height="11" rx="1.4" transform="rotate(12 10.8 28)" />
            </g>
          )}
          <g transform={`rotate(${tilt} 30 37)`}>
            <circle cx="30" cy="25" r="10.5" />
            {who === "kamu" ? (
              <g fill={HAIR}>
                <path d="M19.3 25 C18.6 17.5 23.6 13.2 30.5 13.4 C36.8 13.6 41.3 17.8 40.7 24.2 C38.9 21.4 36.6 19.9 33.6 19.6 C30.2 19.3 27.6 20.9 25.4 21.4 C23.2 21.9 21 23.2 19.3 25 Z" />
                <path d="M24.5 15.2 C25.8 11.8 29.6 10.6 32.4 12.4 C29.8 12.6 28 13.6 26.9 15.4 Z" />
              </g>
            ) : (
              <>
                <path
                  d="M19.6 24.2 C19.4 17.6 24 14 30 14 C36 14 40.6 17.6 40.4 24.2 C38.2 20.4 35.4 18.8 31.8 19.6 C29.4 20.1 27.8 21.8 25 22 C22.8 22.2 21 23 19.6 24.2 Z"
                  fill={HAIR}
                />
                <g transform="translate(37.6 15) rotate(18)" fill={HEART}>
                  <path d="M0 0 L-4.2 -2.8 Q-5 0 -4.2 2.8 Z M0 0 L4.2 -2.8 Q5 0 4.2 2.8 Z" />
                  <circle r="1.4" />
                </g>
              </>
            )}
            <g style={eyes}>
              <g className="animate-eye-blink [transform-box:fill-box] [transform-origin:center]" style={{ animationDelay: `${blinkDelay}ms` }}>
                <circle cx="26.3" cy="24" r={pose === "kaget" ? 2 : 1.7} fill={INK} />
                <circle cx="33.7" cy="24" r={pose === "kaget" ? 2 : 1.7} fill={INK} />
              </g>
            </g>
            {pose === "kaget" ? (
              <circle cx="30" cy="30.2" r="2.1" fill={INK} />
            ) : (
              <path d="M26.8 28.8 q3.2 2.8 6.4 0" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
            )}
          </g>
          {pose === "kaget" && (
            <>
              <circle cx="15.5" cy="27" r="3.3" />
              <circle cx="44.5" cy="27" r="3.3" />
            </>
          )}
        </g>
      </g>
    </svg>
  )
}

// Isi setengah slot strip contoh: latar foto + tokoh dengan pose per urutan.
const BG = [
  ["#40384A", "#372F41"],
  ["#463C33", "#3D342C"],
  ["#33443F", "#2C3B37"],
  ["#4A3A3E", "#413135"],
] as const
export const POSE_SETS: Pose[][] = [
  ["diam", "miring", "peace", "hati"],
  ["kaget", "peace", "miring", "hati"],
  ["miring", "kaget", "diam", "hati"],
]

export function FigureFill({ slot, side, set = 0 }: { slot: number; side: "a" | "b"; set?: number }) {
  const poses = POSE_SETS[set % POSE_SETS.length]
  return (
    <span className="absolute inset-0 overflow-hidden" style={{ background: BG[slot % BG.length][side === "a" ? 0 : 1] }}>
      <Figure
        who={side === "a" ? "kamu" : "dia"}
        pose={poses[slot % poses.length]}
        blinkDelay={slot * 800 + (side === "a" ? 0 : 350) + set * 500}
        className="absolute inset-x-0 bottom-0 h-auto w-full"
      />
    </span>
  )
}

// Siluet bergaris putus-putus: tempat untuk dia yang belum masuk.
export function GhostFigure({ className, label = "?" }: { className?: string; label?: string }) {
  return (
    <svg viewBox="0 0 60 60" aria-hidden className={cn("block", className)} preserveAspectRatio="xMidYMax meet">
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3.2 3" strokeLinecap="round">
        <path d="M13.8 59.2 V49 a11.2 11.2 0 0 1 11.2 -11.2 h10 a11.2 11.2 0 0 1 11.2 11.2 V59.2" />
        <circle cx="30" cy="25" r="10" />
      </g>
      <text x="30" y="29.5" textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor" fontFamily="var(--font-bricolage), sans-serif">
        {label}
      </text>
    </svg>
  )
}
