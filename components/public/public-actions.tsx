"use client"

import { useEffect, useState } from "react"
import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { saveImage } from "@/lib/save-file"
import { supabase } from "@/lib/supabase/client"
import { notify, warn } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { usePwa } from "@/stores/pwa"

// Tombol unduh hanya untuk dua peserta room: dikenali dari sesi anonim di
// browser yang dipakai saat sesi foto. Pengunjung lain tidak diberi sesi baru.
export function MemberDownload({ imageUrl, slug }: { imageUrl: string; slug: string }) {
  const [member, setMember] = useState(false)
  useEffect(() => {
    let alive = true
    const sb = supabase()
    sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      const { data: ok } = await sb.rpc("is_result_member", { p_slug: slug })
      if (alive && ok === true) setMember(true)
    })
    return () => {
      alive = false
    }
  }, [slug])

  if (!member) return null
  return (
    <div className="flex w-full animate-fade-in flex-col items-center gap-1.5 @3xl:items-start">
      <DownloadStripButton imageUrl={imageUrl} slug={slug} className="w-full @3xl:w-auto @3xl:px-6" />
      <span className="text-caption text-muted-foreground">Tombol unduh cuma muncul untuk kalian berdua.</span>
    </div>
  )
}

function DownloadStripButton({ imageUrl, slug, className }: { imageUrl: string; slug: string; className?: string }) {
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
