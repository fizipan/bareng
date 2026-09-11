"use client"

import { create } from "zustand"
import type { LandingStats } from "@/app/api/stats/route"

// Angka hidup landing: satu polling untuk semua komponen yang memakainya,
// tiap 20 detik selama tab terlihat. `at` = waktu data diambil (untuk
// "terakhir jadi … lalu" tanpa Date.now() saat render).
type State = { stats: (LandingStats & { at: number }) | null }

export const useLiveStats = create<State>()(() => ({ stats: null }))

const EVERY_MS = 20_000
let users = 0
let timer: ReturnType<typeof setInterval> | null = null

async function load() {
  try {
    const res = await fetch("/api/stats")
    if (!res.ok) return
    const stats = (await res.json()) as LandingStats
    useLiveStats.setState({ stats: { ...stats, at: Date.now() } })
  } catch {}
}

const onVisible = () => {
  if (document.visibilityState === "visible") load()
}

export function subscribeLiveStats() {
  if (users++ === 0) {
    load()
    timer = setInterval(onVisible, EVERY_MS)
    document.addEventListener("visibilitychange", onVisible)
  }
  return () => {
    if (--users > 0) return
    if (timer) clearInterval(timer)
    timer = null
    document.removeEventListener("visibilitychange", onVisible)
  }
}
