"use client"

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type RefObject } from "react"

// Hook kecil untuk ilustrasi landing: gerak hanya saat terlihat, berhenti
// kalau pengguna minta gerak dikurangi, dan adegan diputar per fase.

const REDUCED = "(prefers-reduced-motion: reduce)"

export function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(REDUCED)
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    () => window.matchMedia(REDUCED).matches,
    () => false
  )
}

// Terlihat di layar (≥ `threshold` bagian); null = belum diamati. Animasi
// di luar layar tidak jalan.
export function useInView<T extends Element>(threshold = 0.35) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState<boolean | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, inView] as const
}

// Atribut untuk wadah ilustrasi: animasi CSS di dalamnya dijeda saat wadah
// tidak terlihat (lihat globals.css), hemat baterai di HP.
export const liveProps = (inView: boolean | null) => ({ "data-art": "", "data-live": inView === false ? undefined : "" })

// Fase adegan 0…durations.length. Komponen dipasang ulang (key) untuk memutar
// dari awal; fase terakhir = gambar lengkap.
export function useTimeline(durations: readonly number[], onDone?: () => void) {
  const [phase, setPhase] = useState(0)
  const done = useEffectEvent(() => onDone?.())
  useEffect(() => {
    if (phase >= durations.length) return
    const t = setTimeout(() => {
      if (phase + 1 >= durations.length) done()
      setPhase(phase + 1)
    }, durations[phase])
    return () => clearTimeout(t)
  }, [phase, durations])
  return phase
}

// Pointer halus (mouse/trackpad) — efek miring/ikut kursor hanya untuk ini;
// di layar sentuh interaksinya lewat ketukan.
export function useFinePointer() {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia("(hover: hover) and (pointer: fine)")
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    () => window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    () => false
  )
}

// Mata tokoh di dalam `ref` mengikuti kursor (mouse saja), dihitung dari
// titik tengah elemen itu sendiri; lewat variabel CSS, tanpa render ulang.
export function useLookAt(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    let raf = 0
    const clamp = (v: number) => Math.max(-1, Math.min(1, v))
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        el.style.setProperty("--look-x", String(clamp((e.clientX - (r.left + r.width / 2)) / 260)))
        el.style.setProperty("--look-y", String(clamp((e.clientY - (r.top + r.height * 0.45)) / 260)))
      })
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      cancelAnimationFrame(raf)
    }
  }, [ref, enabled])
}
