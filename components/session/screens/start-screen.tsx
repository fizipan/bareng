"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { BoothLoader } from "@/components/art/booth-loader"
import { createRoomError, isDailyLimit } from "@/lib/content/room-start"
import { warn } from "@/lib/toast"
import { openQuota } from "@/stores/quota"
import { useSession } from "@/stores/session"

// Tujuan shortcut "Mulai foto bareng" dari ikon aplikasi: langsung bikin room.
export function StartScreen() {
  const router = useRouter()
  const createRoom = useSession((s) => s.createRoom)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    createRoom()
      .then((code) => router.replace(`/r/${code}`))
      .catch((e) => {
        router.replace("/")
        if (isDailyLimit(e)) openQuota(async () => router.push(`/r/${await createRoom({ premium: true })}`))
        else warn(createRoomError(e))
      })
  }, [createRoom, router])

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 px-5" aria-live="polite">
      <BoothLoader />
      <span className="text-small text-muted-foreground">Menyiapkan booth…</span>
    </main>
  )
}
