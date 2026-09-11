"use client"

import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "@/components/art/motion"
import { cn } from "@/lib/utils"
import { subscribeLiveStats, useLiveStats } from "@/stores/live-stats"

// Angka hidup dari database (/api/stats): orang di booth sekarang,
// photostrip hari ini & total. Tidak ada yang sedang foto → tampilkan kapan
// photostrip terakhir jadi, bukan angka nol.

const numbers = new Intl.NumberFormat("id-ID")

function useFeed() {
  useEffect(() => subscribeLiveStats(), [])
  return useLiveStats((s) => s.stats)
}

function ago(from: number, now: number) {
  const m = Math.max(0, Math.round((now - from) / 60_000))
  if (m < 1) return { short: "<1 mnt", long: "baru saja" }
  if (m < 60) return { short: `${m} mnt`, long: `${m} menit lalu` }
  const h = Math.round(m / 60)
  if (h < 24) return { short: `${h} jam`, long: `${h} jam lalu` }
  const d = Math.round(h / 24)
  return { short: `${d} hari`, long: `${d} hari lalu` }
}

// Naik pelan ke nilai baru (saat pertama muncul & tiap berubah).
function CountUp({ value }: { value: number }) {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(0)
  const current = useRef(0)
  useEffect(() => {
    if (reduced) return
    const start = current.current
    if (start === value) return
    const t0 = performance.now()
    let raf = requestAnimationFrame(function step(t) {
      const k = Math.min(1, (t - t0) / 700)
      const next = Math.round(start + (value - start) * (1 - Math.pow(1 - k, 3)))
      current.current = next
      setShown(next)
      if (k < 1) raf = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(raf)
  }, [value, reduced])
  return <>{numbers.format(reduced ? value : shown)}</>
}

function LiveDot({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-flex size-2 shrink-0", className)}>
      <span className="absolute inset-0 animate-ping-ring rounded-full bg-ok" />
      <span className="relative size-2 rounded-full bg-ok" />
    </span>
  )
}

// Baris kecil di bawah tombol hero. Sebelum data ada: teks cadangan.
export function LiveLine({ fallback }: { fallback: string }) {
  const stats = useFeed()
  const live = !!stats && stats.peopleLive > 0
  const recent = !!stats && !live && stats.lastStripAt !== null && stats.at - stats.lastStripAt < 24 * 3_600_000

  if (!stats || (!live && !recent)) return <span className="text-meta text-muted-foreground">{fallback}</span>
  return (
    <span className="inline-flex animate-fade-in items-center gap-2 text-meta text-muted-foreground">
      {live ? (
        <>
          <LiveDot />
          <span>
            <strong className="font-semibold text-foreground">
              <CountUp value={stats.peopleLive} /> orang
            </strong>{" "}
            lagi foto bareng sekarang
          </span>
        </>
      ) : (
        <>
          <span aria-hidden className="size-2 rounded-full bg-shutter" />
          Photostrip terakhir jadi {ago(stats.lastStripAt!, stats.at).long}
        </>
      )}
    </span>
  )
}

// Tiga angka di bawah hero. Tinggi tetap sejak awal (tanda "—" sebelum data).
export function LiveStats() {
  const stats = useFeed()
  const live = !!stats && stats.peopleLive > 0
  const tiles = [
    live
      ? { key: "live", value: <CountUp value={stats.peopleLive} />, label: "orang lagi di booth sekarang", dot: true }
      : {
          key: "last",
          value: stats?.lastStripAt ? ago(stats.lastStripAt, stats.at).short : "—",
          label: "sejak photostrip terakhir jadi",
          dot: false,
        },
    { key: "today", value: stats ? <CountUp value={stats.stripsToday} /> : "—", label: "photostrip jadi hari ini", dot: false },
    { key: "total", value: stats ? <CountUp value={stats.stripsTotal} /> : "—", label: "photostrip sejak diluncurkan", dot: false },
  ]

  return (
    <section
      aria-label="Bareng hari ini"
      className="grid grid-cols-3 divide-x-[1.5px] divide-line rounded-md border-[1.5px] border-line bg-sunken"
    >
      {tiles.map((t) => (
        <div key={t.key} className="flex min-w-0 flex-col gap-1.5 px-3 py-4 @3xl:gap-2 @3xl:px-7 @3xl:py-6">
          <span className="flex items-center gap-2 font-display text-[26px] leading-none font-extrabold tabular-nums @3xl:text-[40px]">
            {t.value}
            {t.dot && <LiveDot className="@3xl:size-2.5" />}
          </span>
          <span className="text-caption text-muted-foreground @3xl:text-small">{t.label}</span>
        </div>
      ))}
    </section>
  )
}
