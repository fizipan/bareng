"use client"

import { useState } from "react"
import { ModeRoot } from "@/components/brand/mode-root"
import { Landing } from "@/components/landing/landing"
import { PrivacyContent } from "@/components/legal/privacy-content"
import { TermsContent } from "@/components/legal/terms-content"
import { PublicResult } from "@/components/public/public-result"
import { FrameContext } from "@/components/session/frame-context"
import { SessionApp } from "@/components/session/session-app"
import { JoinScreen } from "@/components/session/screens/join-screen"
import { ERROR_COPY, type ErrorKind } from "@/lib/content/errors"
import { DEMO_RESULT } from "@/lib/session/demo"
import type { Conn, Screen, Tier } from "@/lib/session/types"
import { cn } from "@/lib/utils"
import { useSession } from "@/stores/session"

type PageKey = "landing" | "gabung" | "paywall" | "publik" | "privasi" | "ketentuan"
type NavKey = PageKey | Screen

const NAV: { key: NavKey; label: string; mode: "Kertas" | "Kabin" }[] = [
  { key: "landing", label: "1 · Landing", mode: "Kertas" },
  { key: "undang", label: "2 · Undang", mode: "Kabin" },
  { key: "gabung", label: "3 · Gabung (tamu)", mode: "Kabin" },
  { key: "izin", label: "4 · Izin kamera", mode: "Kabin" },
  { key: "lobby", label: "5 · Lobby", mode: "Kabin" },
  { key: "capture", label: "6 · Capture", mode: "Kabin" },
  { key: "review", label: "7 · Review", mode: "Kabin" },
  { key: "hasil", label: "8 · Hasil", mode: "Kertas" },
  { key: "paywall", label: "9 · Paywall", mode: "Kertas" },
  { key: "publik", label: "10 · Halaman publik", mode: "Kertas" },
  { key: "error", label: "11 · Error & edge", mode: "Kabin" },
  { key: "privasi", label: "12 · Privasi", mode: "Kertas" },
  { key: "ketentuan", label: "13 · Ketentuan", mode: "Kertas" },
]

const SESSION_KEYS: NavKey[] = ["undang", "izin", "lobby", "capture", "review", "hasil", "error"]

// Pengganti panel samping prototipe: lompat ke layar mana pun dan ubah status
// sesi. Layar sesi memakai store & komponen yang sama dengan /r/[code].
export function ScreensGallery() {
  const [page, setPage] = useState<NavKey>("landing")
  const [frameEl, setFrameEl] = useState<HTMLDivElement | null>(null)
  const s = useSession()
  const active: NavKey = SESSION_KEYS.includes(page) ? s.screen : page

  const go = (key: NavKey) => {
    if (key === "paywall") {
      s.devJump("hasil")
      s.devSetTier("free")
      s.openPaywall()
      setPage("hasil")
      return
    }
    if (SESSION_KEYS.includes(key)) s.devJump(key as Screen)
    setPage(key)
  }

  const chip = (on: boolean) =>
    cn(
      "min-h-[34px] rounded-sm border-[1.5px] px-3 py-[7px] text-caption font-semibold",
      on ? "border-darkroom bg-darkroom text-kertas" : "border-line-strong bg-transparent text-darkroom"
    )

  return (
    <div className="kertas flex min-h-dvh flex-wrap items-start justify-center gap-8 bg-kertas-2 p-7 text-darkroom">
      <aside className="sticky top-7 flex min-w-[236px] flex-[0_1_264px] flex-col gap-[22px]">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-display-sm font-extrabold">Bareng — layar</h1>
          <p className="max-w-[34ch] text-meta text-ink-muted">
            Semua layar MVP, komponen asli aplikasi. Pasangan & kamera masih disimulasikan sampai M2–M3.
          </p>
        </div>

        <nav className="flex flex-col gap-2">
          <span className="text-caption font-semibold text-ink-muted">Layar</span>
          <div className="flex flex-col gap-1">
            {NAV.map((n) => {
              const on = active === n.key || (n.key === "paywall" && s.paywall.open)
              return (
                <button
                  key={n.key}
                  type="button"
                  onClick={() => go(n.key)}
                  className={cn(
                    "flex min-h-[38px] items-center justify-between gap-2 rounded-sm px-3 py-[9px] text-left text-meta font-medium",
                    on ? "bg-darkroom text-kertas" : "text-darkroom hover:bg-line/60"
                  )}
                >
                  <span>{n.label}</span>
                  <span className={cn("text-micro", on ? "text-grain" : "text-[#A9A69E]")}>{n.mode}</span>
                </button>
              )
            })}
          </div>
        </nav>

        <div className="flex flex-col gap-2.5 border-t border-line pt-[18px]">
          <span className="text-caption font-semibold text-ink-muted">Status sesi</span>
          <div className="flex flex-wrap gap-1.5">
            {(["free", "premium"] as Tier[]).map((t) => (
              <button key={t} type="button" className={chip(s.tier === t)} onClick={() => s.devSetTier(t)}>
                {t === "free" ? "Gratis" : "Premium"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["ok", "lambat", "putus"] as Conn[]).map((c) => (
              <button
                key={c}
                type="button"
                className={chip(s.conn === c)}
                onClick={() => {
                  s.devSetConn(c)
                  if (c === "putus") setPage("error")
                }}
              >
                {c === "ok" ? "Tersambung" : c === "lambat" ? "Lemot" : "Terputus"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={chip(false)} onClick={s.toggleSound}>
              {s.sound ? "Suara nyala" : "Suara mati"}
            </button>
            {s.screen === "undang" && !s.partner?.joined && (
              <button type="button" className={chip(false)} onClick={s.devSimulateJoin}>
                Dia masuk
              </button>
            )}
            <button
              type="button"
              className={chip(true)}
              onClick={() => {
                s.reset()
                setPage("landing")
              }}
            >
              Ulang dari awal
            </button>
          </div>
        </div>

        {active === "error" && (
          <div className="flex flex-col gap-2 border-t border-line pt-[18px]">
            <span className="text-caption font-semibold text-ink-muted">Varian error</span>
            {(Object.keys(ERROR_COPY) as ErrorKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => s.devSetError(k)}
                className={cn(
                  "min-h-9 rounded-sm px-3 py-2 text-left text-meta font-medium",
                  s.errorKind === k ? "bg-darkroom text-kertas" : "bg-line text-darkroom"
                )}
              >
                {ERROR_COPY[k].title}
              </button>
            ))}
          </div>
        )}
      </aside>

      <div className="relative h-[864px] w-[410px] shrink-0 overflow-hidden rounded-[46px] border-[10px] border-darkroom bg-darkroom shadow-[0_24px_60px_rgba(22,20,29,.22)]">
        {/* transform: elemen fixed (flash, butiran kabin) terkurung di dalam bingkai */}
        <div
          ref={setFrameEl}
          className="absolute inset-0 overflow-x-hidden overflow-y-auto rounded-[36px] [transform:translateZ(0)]"
        >
          <FrameContext.Provider value={{ container: frameEl }}>
            <Frame page={active} />
          </FrameContext.Provider>
        </div>
      </div>
    </div>
  )
}

function Frame({ page }: { page: NavKey }) {
  if (SESSION_KEYS.includes(page)) return <SessionApp framed />
  const content =
    page === "landing" ? (
      <Landing />
    ) : page === "publik" ? (
      <PublicResult data={DEMO_RESULT} />
    ) : page === "privasi" ? (
      <PrivacyContent />
    ) : page === "ketentuan" ? (
      <TermsContent />
    ) : (
      <JoinScreen />
    )
  return (
    <ModeRoot mode={page === "gabung" ? "kabin" : "kertas"} className="min-h-full">
      {content}
    </ModeRoot>
  )
}
