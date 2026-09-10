"use client"

import { useEffect } from "react"
import { RefreshCwIcon } from "lucide-react"
import { toast } from "sonner"
import { notify } from "@/lib/toast"
import { usePwa, type BeforeInstallPromptEvent } from "@/stores/pwa"
import { IosInstallSheet } from "./ios-install-sheet"

const UPDATE_CHECK_MS = 30 * 60 * 1000

function isIos() {
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

// Versi baru sudah terpasang di belakang layar: tawarkan muat ulang, jangan
// paksa (bisa jadi user sedang di tengah sesi foto).
function offerUpdate(worker: ServiceWorker) {
  const inSession = window.location.pathname.startsWith("/r/")
  toast("Versi baru tersedia", {
    id: "app-update",
    description: inSession ? "Muat ulang setelah sesi foto selesai ya." : "Muat ulang untuk pakai versi terbaru.",
    duration: Infinity,
    icon: (
      <span className="flex size-5 items-center justify-center rounded-full bg-flash text-darkroom">
        <RefreshCwIcon className="size-3" strokeWidth={2.5} />
      </span>
    ),
    action: {
      label: "Muat ulang",
      onClick: () => {
        window.__barengUpdating = true
        worker.postMessage({ type: "SKIP_WAITING" })
      },
    },
    cancel: { label: "Nanti", onClick: () => {} },
  })
}

declare global {
  interface Window {
    __barengUpdating?: boolean
  }
}

// Registrasi service worker, deteksi update, dan penampung prompt pasang.
export function PwaProvider() {
  useEffect(() => {
    usePwa.setState({ ready: true, ios: isIos(), standalone: isStandalone() })

    const onPrompt = (e: Event) => {
      e.preventDefault()
      usePwa.setState({ installEvent: e as BeforeInstallPromptEvent })
    }
    const onInstalled = () => {
      usePwa.setState({ installEvent: null, standalone: true })
      notify("Bareng sudah terpasang di perangkat kamu")
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)

    // Service worker hanya di production: di dev cache-nya mengganggu hot reload.
    const swEnabled =
      "serviceWorker" in navigator &&
      (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_SW === "1")
    let registration: ServiceWorkerRegistration | undefined
    let timer: ReturnType<typeof setInterval> | undefined
    const check = () => registration?.update().catch(() => {})
    const onVisible = () => document.visibilityState === "visible" && check()
    const onControllerChange = () => {
      // Hanya muat ulang kalau user yang minta; aktivasi pertama tidak perlu reload.
      if (window.__barengUpdating) window.location.reload()
    }

    if (swEnabled) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((reg) => {
          registration = reg
          if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting)
          reg.addEventListener("updatefound", () => {
            const worker = reg.installing
            worker?.addEventListener("statechange", () => {
              if (worker.state === "installed" && navigator.serviceWorker.controller) offerUpdate(worker)
            })
          })
          timer = setInterval(check, UPDATE_CHECK_MS)
        })
        .catch(() => {})
      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange)
      document.addEventListener("visibilitychange", onVisible)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
      document.removeEventListener("visibilitychange", onVisible)
      if (swEnabled) navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange)
      if (timer) clearInterval(timer)
    }
  }, [])

  return <IosInstallSheet />
}
