"use client"

import { useEffect } from "react"
import { ModeRoot } from "@/components/brand/mode-root"
import type { Screen } from "@/lib/session/types"
import { cn } from "@/lib/utils"
import { useSession } from "@/stores/session"
import { PaywallSheet } from "./paywall-sheet"
import { CaptureScreen } from "./screens/capture-screen"
import { ErrorScreen } from "./screens/error-screen"
import { InviteScreen } from "./screens/invite-screen"
import { LobbyScreen } from "./screens/lobby-screen"
import { PermissionScreen } from "./screens/permission-screen"
import { ResultScreen } from "./screens/result-screen"
import { ReviewScreen } from "./screens/review-screen"

const SCREENS: Record<Screen, () => React.ReactNode> = {
  undang: InviteScreen,
  izin: PermissionScreen,
  lobby: LobbyScreen,
  capture: CaptureScreen,
  review: ReviewScreen,
  hasil: ResultScreen,
  error: ErrorScreen,
}

const ROOM_CODE = /^[A-Z0-9]{6}$/
const THEME_COLOR = { kabin: "#16141D", kertas: "#F4F3EF" }

// Satu halaman untuk seluruh sesi (undang → hasil), supaya kamera dan koneksi
// WebRTC (M3) tetap hidup saat pindah layar. `framed` = tampil di /dev/screens.
export function SessionApp({ code, framed = false }: { code?: string; framed?: boolean }) {
  const screen = useSession((s) => s.screen)
  const flashing = useSession((s) => s.shot.phase === "flash")
  const enterRoom = useSession((s) => s.enterRoom)
  const fail = useSession((s) => s.fail)
  const mode = screen === "hasil" ? "kertas" : "kabin"

  useEffect(() => {
    if (framed || !code) return
    if (ROOM_CODE.test(code)) enterRoom(code)
    else fail("tidak-ada")
  }, [code, framed, enterRoom, fail])

  useEffect(() => {
    if (framed) return
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[mode])
  }, [mode, framed])

  const ScreenView = SCREENS[screen]
  // Layar capture tidak di-scroll: strip menyesuaikan tinggi layar.
  const fixedHeight = screen === "capture"

  return (
    <ModeRoot
      mode={mode}
      className={cn(framed && "min-h-full", fixedHeight && (framed ? "h-full" : "h-dvh"), fixedHeight && "overflow-hidden")}
    >
      <main key={screen} className="relative mx-auto flex min-h-0 w-full max-w-[440px] flex-1 animate-fade-in flex-col">
        <ScreenView />
      </main>
      {flashing && <div aria-hidden className="pointer-events-none fixed inset-0 z-50 animate-flash bg-kertas" />}
      <PaywallSheet />
    </ModeRoot>
  )
}
