"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRightIcon, CameraIcon, LoaderCircleIcon } from "lucide-react"
import { StripIcon } from "@/components/brand/strip-icon"
import { Button } from "@/components/ui/button"
import { warn } from "@/lib/toast"
import { cn } from "@/lib/utils"

// Kode sesi (Supabase, realtime, zod) baru dimuat saat tombol hampir diklik,
// jadi landing tetap ringan.
const loadSession = () => import("@/stores/session")

// Tombol utama landing: langsung membuat room, tanpa langkah perantara (R0).
// Varian hero jelas berbentuk tombol: ikon kamera, panah "lanjut", bayangan.
export function StartButton({ variant = "hero", className }: { variant?: "hero" | "compact"; className?: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const warm = () => void loadSession().catch(() => {})

  const start = async () => {
    if (busy) return
    setBusy(true)
    try {
      const { useSession } = await loadSession()
      router.push(`/r/${await useSession.getState().createRoom()}`)
    } catch {
      warn("Belum bisa bikin room, coba lagi sebentar")
      setBusy(false)
    }
  }

  if (variant === "compact") {
    return (
      <Button
        onClick={start}
        onPointerEnter={warm}
        onFocus={warm}
        onTouchStart={warm}
        aria-busy={busy || undefined}
        className={cn("self-start px-[22px]", busy && "cursor-progress", className)}
      >
        {busy ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <StripIcon data-icon="inline-start" />}
        {busy ? "Menyiapkan booth…" : "Mulai foto bareng"}
      </Button>
    )
  }

  return (
    <Button
      size="lg"
      onClick={start}
      onPointerEnter={warm}
      onFocus={warm}
      onTouchStart={warm}
      // Saat menyiapkan room tombol tetap merah (bukan abu-abu disabled);
      // klik ganda dicegah oleh `busy` di start().
      aria-busy={busy || undefined}
      className={cn(
        "group h-16 w-full justify-start gap-3.5 pr-3 text-left shadow-[0_10px_24px_-10px_rgb(228_70_46/0.7)] hover:shadow-[0_14px_28px_-10px_rgb(228_70_46/0.8)]",
        busy && "cursor-progress",
        className
      )}
    >
      <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-kertas/20">
        <CameraIcon className="size-[18px]" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5" aria-live="polite">
        <span>{busy ? "Menyiapkan booth…" : "Mulai foto bareng"}</span>
        <span className="text-caption font-normal text-[#FFD8D0]">
          {busy ? "Sebentar, room lagi dibuat" : "Kamu bikin room, dia tinggal klik"}
        </span>
      </span>
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-kertas text-shutter transition-transform duration-200 group-hover:translate-x-0.5"
      >
        {busy ? (
          <LoaderCircleIcon className="size-[18px] animate-spin" strokeWidth={2.5} />
        ) : (
          <ArrowRightIcon className="size-[18px]" strokeWidth={2.5} />
        )}
      </span>
    </Button>
  )
}
