"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { StripIcon } from "@/components/brand/strip-icon"
import { Button } from "@/components/ui/button"
import { warn } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { useSession } from "@/stores/session"

// Tombol utama landing: langsung membuat room, tanpa langkah perantara (R0).
export function StartButton({ variant = "hero", className }: { variant?: "hero" | "compact"; className?: string }) {
  const router = useRouter()
  const createRoom = useSession((s) => s.createRoom)
  const [busy, setBusy] = useState(false)

  const start = async () => {
    if (busy) return
    setBusy(true)
    try {
      router.push(`/r/${await createRoom()}`)
    } catch {
      warn("Belum bisa bikin room, coba lagi sebentar")
      setBusy(false)
    }
  }

  if (variant === "compact") {
    return (
      <Button onClick={start} disabled={busy} className={cn("self-start px-[22px]", className)}>
        <StripIcon data-icon="inline-start" />
        {busy ? "Menyiapkan booth…" : "Mulai foto bareng"}
      </Button>
    )
  }

  return (
    <Button size="lg" onClick={start} disabled={busy} className={cn("h-15 w-full justify-start gap-3.5 text-left", className)}>
      <span aria-hidden className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-kertas/20">
        <span className={cn("size-[15px] rounded-full bg-kertas", busy && "animate-blink")} />
      </span>
      <span className="flex flex-col gap-0.5">
        <span>{busy ? "Menyiapkan booth…" : "Mulai foto bareng"}</span>
        <span className="text-caption font-normal text-[#FFD8D0]">Kamu bikin room, dia tinggal klik</span>
      </span>
    </Button>
  )
}
