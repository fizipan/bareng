"use client"

import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "@/components/art/motion"
import { cn } from "@/lib/utils"
import { subscribeLiveStats, useLiveStats } from "@/stores/live-stats"

// Angka hidup dari database (/api/stats). Tidak ada yang sedang foto →
// tampilkan kapan photostrip terakhir jadi, bukan angka nol.

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

// Satu baris kecil di bawah tombol hero: siapa yang lagi foto (atau kapan
// photostrip terakhir jadi) · photostrip hari ini (atau total). Sebelum data
// ada / gagal: teks cadangan.
export function LiveLine({ fallback }: { fallback: string }) {
  const stats = useFeed()
  if (!stats) return <span className="text-meta text-muted-foreground">{fallback}</span>

  const live = stats.peopleLive > 0
  const strong = "font-semibold text-foreground tabular-nums"
  const first = live ? (
    <>
      <strong className={strong}>
        <CountUp value={stats.peopleLive} /> orang
      </strong>{" "}
      lagi foto
    </>
  ) : stats.lastStripAt !== null ? (
    <>
      terakhir jadi <strong className={strong}>{ago(stats.lastStripAt, stats.at).long}</strong>
    </>
  ) : null
  const count = stats.stripsToday > 0 ? stats.stripsToday : stats.stripsTotal
  const second =
    count > 0 ? (
      <>
        <strong className={strong}>
          <CountUp value={count} />
        </strong>{" "}
        photostrip {stats.stripsToday > 0 ? "hari ini" : "sejauh ini"}
      </>
    ) : null

  if (!first && !second) return <span className="text-meta text-muted-foreground">{fallback}</span>
  return (
    <span className="inline-flex animate-fade-in flex-wrap items-center gap-x-2 gap-y-1 text-meta text-muted-foreground">
      {live ? <LiveDot /> : <span aria-hidden className="size-2 rounded-full bg-grain/60" />}
      {first && <span>{first}</span>}
      {first && second && <span aria-hidden>·</span>}
      {second && <span>{second}</span>}
    </span>
  )
}
