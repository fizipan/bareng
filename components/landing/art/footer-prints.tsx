"use client"

import { useState, type PointerEvent as ReactPointerEvent } from "react"
import { Strip } from "@/components/strip/strip"
import { SITE_HOST } from "@/lib/brand"
import { getTemplate } from "@/lib/templates/builtin"
import { cn } from "@/lib/utils"
import { FigureFill } from "@/components/art/figure"
import { liveProps, useFinePointer, useInView, useLookAt, useReducedMotion } from "@/components/art/motion"

// Tiga strip asli keluar dari slot mesin satu per satu saat footer terlihat,
// lalu ditumpuk seperti hasil cetak; bergeser mengikuti kursor.
const PRINTS = [
  { id: "polaroid", className: "left-[11%] top-9 w-[27%] -rotate-10", depth: 8 },
  { id: "kodak", className: "left-1/2 top-0 z-10 w-[31%] -translate-x-1/2 rotate-2", depth: 16 },
  { id: "valentine", className: "right-[11%] top-12 w-[27%] rotate-10", depth: 8 },
]
const ORDER = [1, 0, 2]

export function FooterPrints() {
  const reduced = useReducedMotion()
  const fine = useFinePointer()
  const [ref, inView] = useInView<HTMLDivElement>(0.25)
  const [seen, setSeen] = useState(false)
  if (inView && !seen) setSeen(true)
  useLookAt(ref, fine && !reduced)

  const parallax = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!fine || reduced) return
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty("--px", String(((e.clientX - r.left) / r.width) * 2 - 1))
    e.currentTarget.style.setProperty("--py", String(((e.clientY - r.top) / r.height) * 2 - 1))
  }

  return (
    <div
      ref={ref}
      {...liveProps(inView)}
      aria-hidden
      onPointerMove={parallax}
      onPointerLeave={(e) => {
        e.currentTarget.style.setProperty("--px", "0")
        e.currentTarget.style.setProperty("--py", "0")
      }}
      className="relative mx-auto h-[220px] w-full max-w-[420px] [mask-image:linear-gradient(#000_62%,transparent)] @3xl:h-[340px]"
    >
      {PRINTS.map(({ id, className, depth }, i) => (
        <div key={id} className={cn("absolute", className)}>
          <div
            className="transition-transform duration-500 ease-out"
            style={{ transform: `translate(calc(var(--px, 0) * ${depth}px), calc(var(--py, 0) * ${depth * 0.5}px))` }}
          >
            <div
              className={cn(seen ? "animate-print" : "-translate-y-[110%]", reduced && "translate-y-0")}
              style={{ animationDelay: `${ORDER.indexOf(i) * 260}ms` }}
            >
              <Strip
                template={getTemplate(id)}
                tokens={{ date: "14.02.27", host: SITE_HOST }}
                shadow="strip-dark"
                renderHalf={(slot, side) => <FigureFill slot={slot} side={side} set={i + 1} />}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Kilap yang menyapu strip premium saat terlihat dan saat disentuh.
export function GlintStrip({
  children,
  glint = true,
  className,
}: {
  children: React.ReactNode
  glint?: boolean
  className?: string
}) {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLDivElement>(0.5)
  const [run, setRun] = useState(0)
  return (
    <div
      ref={ref}
      {...liveProps(inView)}
      aria-hidden
      onPointerEnter={() => setRun((r) => r + 1)}
      className={cn("relative", className)}
    >
      {children}
      {glint && inView && !reduced && (
        // Lapisan sendiri supaya bayangan strip tidak ikut terpotong.
        <span className="pointer-events-none absolute inset-0 overflow-hidden">
          <span
            key={run}
            className="absolute inset-y-0 left-0 w-1/3 animate-glint bg-linear-to-r from-transparent via-white/45 to-transparent"
            style={{ animationDelay: run === 0 ? "400ms" : "0ms" }}
          />
        </span>
      )}
    </div>
  )
}
