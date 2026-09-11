"use client"

import { useEffect } from "react"
import { ModeRoot } from "@/components/brand/mode-root"
import type { Screen } from "@/lib/session/types"
import { cn } from "@/lib/utils"
import { media } from "@/stores/media"
import { useSession } from "@/stores/session"
import { PaywallSheet } from "./paywall-sheet"
import { RemoteAudio } from "./remote-audio"
import { CaptureScreen } from "./screens/capture-screen"
import { ConnectingScreen } from "./screens/connecting-screen"
import { ErrorScreen } from "./screens/error-screen"
import { InviteScreen } from "./screens/invite-screen"
import { LobbyScreen } from "./screens/lobby-screen"
import { PermissionScreen } from "./screens/permission-screen"
import { ResultScreen } from "./screens/result-screen"
import { ReviewScreen } from "./screens/review-screen"

const SCREENS: Record<Screen, () => React.ReactNode> = {
  connecting: ConnectingScreen,
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
    // Keluar halaman (tombol back, pindah room): matikan kamera & sambungan.
    return () => useSession.getState().reset()
  }, [code, framed, enterRoom, fail])

  // Kamera & mic hanya hidup saat dipakai: dijeda di review (bisa foto ulang),
  // dimatikan total di hasil (tidak ada kamera lagi setelah photostrip jadi).
  useEffect(() => {
    if (framed) return
    if (screen === "review") media.rest()
    else if (screen === "lobby" || screen === "capture") media.wake()
    else if (screen === "hasil") media.stop()
  }, [screen, framed])

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
      <main
        key={screen}
        data-screen={screen}
        className={cn(
          "relative mx-auto flex min-h-0 w-full flex-1 animate-fade-in flex-col",
          // Hasil punya tata letak dua kolom di layar lebar; sisanya satu kolom HP.
          screen === "hasil" || screen === "review" ? "max-w-[1040px]" : "max-w-[440px]"
        )}
      >
        <ScreenView />
      </main>
      {flashing && <div aria-hidden className="pointer-events-none fixed inset-0 z-50 animate-flash bg-kertas" />}
      <PaywallSheet />
      {!framed && <RemoteAudio />}
    </ModeRoot>
  )
}
