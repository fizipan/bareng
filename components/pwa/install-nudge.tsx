"use client"

import { useEffect, useState } from "react"
import { XIcon } from "lucide-react"
import { LogoMark } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { isInstallSnoozed, snoozeInstall, useCanInstall, usePwa, visitNumber } from "@/stores/pwa"

// Ajakan pasang yang sopan: tidak muncul begitu halaman dibuka (dulu chip di
// hero muncul tiba-tiba & menggeser isi). Baru meluncur dari bawah setelah
// pengunjung terlihat tertarik — menggulir sampai `anchor` — atau di
// kunjungan berikutnya. Tutup = tunda 14 hari.
export function InstallNudge({ anchor = "#template" }: { anchor?: string }) {
  const canInstall = useCanInstall()
  const sheetOpen = usePwa((s) => s.sheetOpen)
  const openSheet = usePwa((s) => s.openSheet)
  const [shown, setShown] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (!canInstall || isInstallSnoozed()) return
    let timer: number | undefined
    const reveal = (ms: number) => {
      if (timer === undefined) timer = window.setTimeout(() => setShown(true), ms)
    }
    if (visitNumber() >= 2) reveal(6000)
    const target = document.querySelector(anchor)
    const io = target
      ? new IntersectionObserver(([e]) => (e.isIntersecting || e.boundingClientRect.top < 0) && reveal(1500), { threshold: 0.4 })
      : null
    if (target && io) io.observe(target)
    return () => {
      io?.disconnect()
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [canInstall, anchor])

  const dismiss = (then?: () => void) => {
    setLeaving(true)
    setTimeout(() => {
      setGone(true)
      then?.()
    }, 180)
  }

  if (!shown || gone || !canInstall || sheetOpen) return null

  return (
    <aside
      aria-label="Pasang aplikasi"
      className={cn(
        "fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-[440px] items-center gap-3 rounded-md border-[1.5px] border-line bg-background py-2.5 pr-1.5 pl-3 shadow-toast transition-[opacity,transform] duration-200 ease-out",
        leaving ? "translate-y-3 opacity-0" : "animate-rise"
      )}
    >
      <LogoMark size={40} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-small font-semibold">Pasang Bareng</span>
        <span className="text-caption leading-snug text-muted-foreground">Buka dari layar utama, tanpa toko aplikasi.</span>
      </span>
      <Button size="sm" onClick={() => dismiss(openSheet)}>
        Pasang
      </Button>
      <button
        type="button"
        aria-label="Nanti saja"
        onClick={() => {
          snoozeInstall()
          dismiss()
        }}
        className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-sunken hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <XIcon className="size-4" />
      </button>
    </aside>
  )
}
