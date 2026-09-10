"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { LogoMark } from "@/components/brand/logo"
import { useSession } from "@/stores/session"

// Tujuan shortcut "Mulai foto bareng" dari ikon aplikasi: langsung bikin room.
export function StartScreen() {
  const router = useRouter()
  const createRoom = useSession((s) => s.createRoom)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    router.replace(`/r/${createRoom()}`)
  }, [createRoom, router])

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5" aria-live="polite">
      <LogoMark size={48} className="animate-blink" />
      <span className="text-small text-muted-foreground">Menyiapkan booth…</span>
    </main>
  )
}
