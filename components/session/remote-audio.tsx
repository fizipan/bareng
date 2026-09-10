"use client"

import { useEffect, useRef } from "react"
import { useMedia } from "@/stores/media"

// Suara pasangan (kalau mic-nya dinyalakan). Satu elemen untuk seluruh sesi,
// jadi obrolan tidak terputus saat pindah layar.
export function RemoteAudio() {
  const remote = useMedia((m) => m.remote)
  const ref = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = ref.current
    if (!audio || !remote) return
    const resume = () => audio.play().catch(() => {})
    const play = () => {
      audio.srcObject = remote
      // Autoplay diblokir browser: putar setelah sentuhan berikutnya.
      audio.play().catch(() => document.addEventListener("pointerdown", resume, { once: true }))
    }
    play()
    remote.addEventListener("addtrack", play)
    return () => {
      remote.removeEventListener("addtrack", play)
      document.removeEventListener("pointerdown", resume)
      audio.srcObject = null
    }
  }, [remote])

  return <audio ref={ref} autoPlay hidden />
}
