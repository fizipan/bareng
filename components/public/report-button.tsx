"use client"

import { useState, useSyncExternalStore } from "react"
import { FlagIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase/client"
import { notify, warn } from "@/lib/toast"
import { cn } from "@/lib/utils"

const REASONS = [
  { id: "seksual-kekerasan", label: "Konten seksual atau kekerasan" },
  { id: "tanpa-izin", label: "Foto diambil tanpa izin" },
  { id: "spam", label: "Spam atau penipuan" },
  { id: "lainnya", label: "Lainnya" },
]

const storageKey = (slug: string) => `bareng-reported:${slug}`
const onStorage = (cb: () => void) => {
  window.addEventListener("storage", cb)
  return () => window.removeEventListener("storage", cb)
}
const readReported = (slug: string) => {
  try {
    return localStorage.getItem(storageKey(slug))
  } catch {
    return null
  }
}

// Laporan konten dari halaman publik (tanpa perlu login): pilih alasan dulu,
// satu kali per browser. Tim meninjau antrean laporan dan bisa menurunkannya.
export function ReportButton({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [justSent, setJustSent] = useState(false)
  const stored = useSyncExternalStore(onStorage, () => readReported(slug), () => null)
  const sent = justSent || stored !== null

  const send = async () => {
    if (!reason) return
    setSending(true)
    const { error } = await supabase().rpc("report_result", { p_slug: slug, p_reason: reason })
    setSending(false)
    if (error) {
      warn("Laporan belum terkirim, coba lagi")
      return
    }
    try {
      localStorage.setItem(storageKey(slug), reason)
    } catch {}
    setJustSent(true)
    setOpen(false)
    notify("Laporan terkirim. Terima kasih, kami tinjau ya")
  }

  return (
    <>
      <Button
        variant="ghost"
        size="inline"
        className="text-meta font-normal"
        disabled={sent}
        onClick={() => setOpen(true)}
      >
        {sent ? "Sudah dilaporkan" : "Laporkan halaman ini"}
      </Button>
      <Dialog open={open} onOpenChange={(next) => !sending && setOpen(next)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Laporkan photostrip ini?</DialogTitle>
            <DialogDescription>
              Laporan dikirim tanpa nama. Kami tinjau, dan photostrip yang melanggar ketentuan akan kami turunkan.
            </DialogDescription>
          </DialogHeader>
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Alasan laporan</legend>
            {REASONS.map((r) => (
              <label
                key={r.id}
                className={cn(
                  "flex min-h-12 cursor-pointer items-center gap-3 rounded-md border-[1.5px] px-3.5 text-small transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                  reason === r.id ? "border-foreground bg-card font-semibold" : "border-line hover:border-line-strong"
                )}
              >
                <input
                  type="radio"
                  name="alasan"
                  value={r.id}
                  checked={reason === r.id}
                  onChange={() => setReason(r.id)}
                  className="size-4 accent-shutter"
                />
                {r.label}
              </label>
            ))}
          </fieldset>
          <div className="flex flex-col gap-2">
            <Button onClick={send} disabled={!reason || sending}>
              <FlagIcon data-icon="inline-start" />
              {sending ? "Mengirim…" : "Kirim laporan"}
            </Button>
            <DialogClose render={<Button variant="ghost" />}>Batal</DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
