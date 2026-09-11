"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export type TocItem = { id: string; label: string }

// Daftar isi yang menempel di desktop lebar; bagian yang sedang dibaca ditandai.
// Item yang diklik tetap ditandai sampai guliran selesai, walau bagiannya ada
// di dasar halaman dan nggak bisa naik sampai atas.
export function LegalToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string | undefined>(items[0]?.id)
  const lock = useRef<string | null>(null)
  const lockTimer = useRef<number>(undefined)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      if (lock.current) return
      const line = window.innerHeight * 0.3
      let current = items[0]?.id
      for (const { id } of items) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) current = id
      }
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      setActive(atEnd ? items.at(-1)?.id : current)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const release = () => {
      lock.current = null
    }
    update()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    window.addEventListener("scrollend", release)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(lockTimer.current)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      window.removeEventListener("scrollend", release)
    }
  }, [items])

  const pick = (id: string) => {
    lock.current = id
    setActive(id)
    // Cadangan kalau bagiannya sudah terlihat (tak ada guliran → tak ada scrollend).
    window.clearTimeout(lockTimer.current)
    lockTimer.current = window.setTimeout(() => (lock.current = null), 1500)
  }

  return (
    <nav aria-label="Di halaman ini" className="hidden @5xl:block">
      <div className="sticky top-8 flex flex-col gap-3">
        <span className="text-caption font-semibold text-muted-foreground">Di halaman ini</span>
        <ul className="flex flex-col border-l-[1.5px] border-line">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={() => pick(item.id)}
                aria-current={item.id === active ? "location" : undefined}
                className={cn(
                  "-ml-[1.5px] block border-l-[1.5px] py-1.5 pl-3.5 text-small transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  item.id === active
                    ? "border-shutter font-semibold text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
