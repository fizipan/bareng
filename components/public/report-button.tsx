"use client"

import { useId, useState, useSyncExternalStore } from "react"
import { CheckIcon, FlagIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { NOTE_MAX, NOTE_MIN_OTHER, REPORT_REASONS } from "@/lib/content/report-reasons"
import { supabase } from "@/lib/supabase/client"
import { warn } from "@/lib/toast"
import { cn } from "@/lib/utils"

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

// Laporan konten dari halaman publik (tanpa perlu login): pilih alasan,
// catatan (wajib untuk "Lainnya"), lalu tanda terima. Satu kali per browser;
// tim meninjau di /admin dan dapat email.
export function ReportButton({ slug }: { slug: string }) {
  const noteId = useId()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const stored = useSyncExternalStore(onStorage, () => readReported(slug), () => null)
  const sent = done || stored !== null

  const needsNote = reason === "lainnya"
  const valid = !!reason && (!needsNote || note.trim().length >= NOTE_MIN_OTHER)

  const send = async () => {
    if (!valid) return
    setSending(true)
    // Sesi anonim (kalau ada) ikut dikirim: satu laporan per orang.
    const { data } = await supabase().auth.getSession()
    const token = data.session?.access_token
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ slug, reason, note: note.trim() || undefined }),
    }).catch(() => null)
    setSending(false)
    if (!res?.ok) {
      warn("Laporan belum terkirim, coba lagi")
      return
    }
    try {
      localStorage.setItem(storageKey(slug), reason!)
    } catch {}
    setDone(true)
  }

  return (
    <>
      <Button variant="ghost" size="inline" className="text-meta font-normal" disabled={sent} onClick={() => setOpen(true)}>
        {sent ? "Sudah dilaporkan" : "Laporkan halaman ini"}
      </Button>
      <Dialog open={open} onOpenChange={(next) => !sending && setOpen(next)}>
        <DialogContent showCloseButton={false}>
          {done ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <span aria-hidden className="grid size-12 place-items-center rounded-full bg-ok/15 text-ok">
                <CheckIcon className="size-6" strokeWidth={2.5} />
              </span>
              <DialogTitle>Terima kasih, laporan terkirim</DialogTitle>
              <DialogDescription>
                Kami tinjau secepatnya. Photostrip yang melanggar ketentuan akan kami turunkan.
              </DialogDescription>
              <DialogClose render={<Button className="mt-2 w-full" />}>Tutup</DialogClose>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Laporkan photostrip ini?</DialogTitle>
                <DialogDescription>Laporan dikirim tanpa nama dan hanya dilihat tim Bareng.</DialogDescription>
              </DialogHeader>
              <fieldset className="flex flex-col gap-2">
                <legend className="sr-only">Alasan laporan</legend>
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-md border-[1.5px] px-3.5 py-3 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                      reason === r.id ? "border-foreground bg-card" : "border-line hover:border-line-strong"
                    )}
                  >
                    <input
                      type="radio"
                      name="alasan"
                      value={r.id}
                      checked={reason === r.id}
                      onChange={() => setReason(r.id)}
                      className="mt-0.5 size-4 shrink-0 accent-shutter"
                    />
                    <span className="flex flex-col gap-0.5">
                      <span className={cn("text-small", reason === r.id && "font-semibold")}>{r.label}</span>
                      <span className="text-caption text-muted-foreground">{r.hint}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              {reason && (
                <div className="flex animate-fade-in flex-col gap-1.5">
                  <label htmlFor={noteId} className="flex items-baseline justify-between text-small font-semibold">
                    <span>
                      Catatan{" "}
                      <span className="font-normal text-muted-foreground">{needsNote ? "(wajib)" : "(opsional)"}</span>
                    </span>
                    <span className="text-caption font-normal text-muted-foreground tabular-nums">
                      {note.length}/{NOTE_MAX}
                    </span>
                  </label>
                  <textarea
                    id={noteId}
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
                    rows={3}
                    placeholder={needsNote ? "Ceritakan singkat apa yang salah dengan photostrip ini" : "Detail tambahan kalau ada"}
                    className="resize-none rounded-md border-[1.5px] border-line bg-sunken px-3.5 py-2.5 text-body outline-none placeholder:text-muted-foreground focus-visible:border-foreground"
                  />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Button onClick={send} disabled={!valid || sending}>
                  <FlagIcon data-icon="inline-start" />
                  {sending ? "Mengirim…" : "Kirim laporan"}
                </Button>
                <DialogClose render={<Button variant="ghost" />}>Batal</DialogClose>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
