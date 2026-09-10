"use client"

import { useRouter } from "next/navigation"
import { StripIcon } from "@/components/brand/strip-icon"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSession } from "@/stores/session"

// Tombol utama landing: langsung membuat room, tanpa langkah perantara (R0).
export function StartButton({ variant = "hero", className }: { variant?: "hero" | "compact"; className?: string }) {
  const router = useRouter()
  const createRoom = useSession((s) => s.createRoom)
  const start = () => router.push(`/r/${createRoom()}`)

  if (variant === "compact") {
    return (
      <Button onClick={start} className={cn("self-start px-[22px]", className)}>
        <StripIcon data-icon="inline-start" />
        Mulai foto bareng
      </Button>
    )
  }

  return (
    <Button size="lg" onClick={start} className={cn("h-15 w-full justify-start gap-3.5 text-left", className)}>
      <span aria-hidden className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-kertas/20">
        <span className="size-[15px] rounded-full bg-kertas" />
      </span>
      <span className="flex flex-col gap-0.5">
        <span>Mulai foto bareng</span>
        <span className="text-caption font-normal text-[#FFD8D0]">Kamu bikin room, dia tinggal klik</span>
      </span>
    </Button>
  )
}
