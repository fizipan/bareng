"use client"

import { useState } from "react"
import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { saveImage } from "@/lib/save-file"
import { notify, warn } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { usePwa } from "@/stores/pwa"

// Simpan photostrip dari halaman publik (misalnya dia yang menerima link).
export function DownloadStripButton({ imageUrl, slug, className }: { imageUrl: string; slug: string; className?: string }) {
  const [saving, setSaving] = useState(false)
  return (
    <Button
      variant="secondary"
      className={className}
      disabled={saving}
      onClick={async () => {
        setSaving(true)
        try {
          const res = await fetch(imageUrl)
          if (!res.ok) throw new Error(String(res.status))
          await saveImage(await res.blob(), `bareng-${slug}.jpg`, { ios: usePwa.getState().ios, title: "Photostrip Bareng" })
          notify("Photostrip tersimpan")
        } catch (e) {
          if ((e as DOMException)?.name !== "AbortError") warn("Belum bisa menyimpan, coba lagi")
        } finally {
          setSaving(false)
        }
      }}
    >
      <DownloadIcon data-icon="inline-start" className={cn(saving && "animate-blink")} />
      {saving ? "Menyiapkan file…" : "Unduh photostrip"}
    </Button>
  )
}

export function CopyPageLink({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href)
          setCopied(true)
          notify("Link disalin")
          setTimeout(() => setCopied(false), 2000)
        } catch {
          warn("Gagal menyalin link")
        }
      }}
      className={cn(
        "inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full bg-card px-3.5 text-caption font-semibold outline-none transition-colors hover:bg-card/70 focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      {copied ? <CheckIcon aria-hidden className="size-3.5 text-ok" /> : <CopyIcon aria-hidden className="size-3.5" />}
      {copied ? "Tersalin" : "Salin link"}
    </button>
  )
}
