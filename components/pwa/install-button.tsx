"use client"

import { useSyncExternalStore } from "react"
import { DownloadIcon, XIcon } from "lucide-react"
import { LogoMark } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useCanInstall, usePwa } from "@/stores/pwa"

// Tombol "Pasang aplikasi". Muncul hanya kalau bisa dipasang: Android/desktop
// Chromium membuka prompt bawaan, iOS membuka panduan Tambah ke Layar Utama.
export function InstallButton({ variant = "link", className }: { variant?: "link" | "footer"; className?: string }) {
  const canInstall = useCanInstall()
  const install = usePwa((s) => s.install)
  if (!canInstall) return null

  if (variant === "footer") {
    return (
      <li>
        <button
          type="button"
          onClick={() => install()}
          className={cn("text-left text-kertas/90 underline-offset-4 hover:text-kertas hover:underline", className)}
        >
          Pasang aplikasi
        </button>
      </li>
    )
  }
  return (
    <Button variant="link" size="inline" className={cn("self-start", className)} onClick={() => install()}>
      <DownloadIcon data-icon="inline-start" />
      Pasang aplikasinya di HP
    </Button>
  )
}

const DISMISS_KEY = "bareng:install-card-dismissed"
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb)
  return () => window.removeEventListener("storage", cb)
}
const readDismissed = () => {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1"
  } catch {
    return false
  }
}

// Kartu ajakan pasang setelah sesi pertama selesai (PRD P1).
export function InstallCard({ className }: { className?: string }) {
  const canInstall = useCanInstall()
  const install = usePwa((s) => s.install)
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => true)
  if (!canInstall || dismissed) return null

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1")
      window.dispatchEvent(new StorageEvent("storage"))
    } catch {}
  }

  return (
    <div className={cn("relative flex w-full items-center gap-3 rounded-md border-[1.5px] border-line p-3.5 text-left", className)}>
      <LogoMark size={40} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-small font-semibold">Pasang Bareng di HP</span>
        <span className="text-caption text-muted-foreground">Nanti tinggal buka dari layar utama.</span>
      </span>
      <Button size="sm" className="h-9 px-3.5" onClick={() => install()}>
        Pasang
      </Button>
      <button
        type="button"
        aria-label="Tutup ajakan pasang"
        onClick={dismiss}
        className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-card text-muted-foreground"
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  )
}
