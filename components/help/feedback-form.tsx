"use client"

import { useId, useState } from "react"
import { BugIcon, CheckIcon, CircleHelpIcon, LightbulbIcon, MessageSquareIcon, SendIcon, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FEEDBACK_KINDS, FEEDBACK_MAX, FEEDBACK_MIN, type FeedbackKind } from "@/lib/content/feedback"
import { collectDeviceInfo } from "@/lib/device-info"
import { supabase } from "@/lib/supabase/client"
import { warn } from "@/lib/toast"
import { cn } from "@/lib/utils"

const ICONS: Record<FeedbackKind, LucideIcon> = {
  bug: BugIcon,
  masukan: LightbulbIcon,
  pertanyaan: CircleHelpIcon,
  lainnya: MessageSquareIcon,
}

const isKind = (v: string | null): v is FeedbackKind => FEEDBACK_KINDS.some((k) => k.id === v)

// Form Pusat bantuan: jenis, cerita, kode room & email (opsional). Dipakai di
// /bantuan (isian awal dari ?jenis=bug&room=ABC123) dan di modal tombol
// bantuan melayang (kode room dari sesi yang sedang berjalan).
export function FeedbackForm({
  initialKind,
  initialRoom,
  bare = false,
}: {
  initialKind?: string | null
  initialRoom?: string | null
  bare?: boolean
}) {
  const id = useId()
  const [kind, setKind] = useState<FeedbackKind>(isKind(initialKind ?? null) ? (initialKind as FeedbackKind) : "bug")
  const [message, setMessage] = useState("")
  const [roomCode, setRoomCode] = useState((initialRoom ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
  const [email, setEmail] = useState("")
  const [trap, setTrap] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const current = FEEDBACK_KINDS.find((k) => k.id === kind)!
  const tooShort = message.trim().length < FEEDBACK_MIN
  const codeOk = roomCode === "" || /^[A-Z0-9]{6}$/.test(roomCode)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (tooShort || !codeOk || sending) return
    setSending(true)
    const [{ data }, meta] = await Promise.all([supabase().auth.getSession(), collectDeviceInfo().catch(() => ({}))])
    const token = data.session?.access_token
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ kind, message, email, roomCode, page: location.pathname, meta, trap }),
    }).catch(() => null)
    setSending(false)
    if (res?.ok) {
      setSent(true)
      return
    }
    warn(res?.status === 429 ? "Sudah banyak kiriman, coba lagi sebentar lagi" : "Belum terkirim, coba lagi")
  }

  if (sent) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-3 px-5 py-10 text-center",
          !bare && "rounded-md border-[1.5px] border-line bg-sunken"
        )}
      >
        <span aria-hidden className="grid size-12 place-items-center rounded-full bg-ok/15 text-ok">
          <CheckIcon className="size-6" strokeWidth={2.5} />
        </span>
        <p className="font-display text-title font-bold">Terima kasih, sudah kami terima</p>
        <p className="max-w-[40ch] text-small text-muted-foreground">
          {email ? `Kalau perlu, kami balas ke ${email}.` : "Kami baca satu per satu. Makasih udah bantu bikin Bareng lebih baik."}
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-1"
          onClick={() => {
            setSent(false)
            setMessage("")
          }}
        >
          Kirim yang lain
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={submit}
      className={cn("relative flex flex-col gap-5", !bare && "rounded-md border-[1.5px] border-line bg-sunken p-4 @xl/content:p-6")}
    >
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 text-small font-semibold">Mau kirim apa?</legend>
        <div className="grid grid-cols-2 gap-2 @xl/content:grid-cols-4">
          {FEEDBACK_KINDS.map((k) => {
            const Icon = ICONS[k.id]
            const on = k.id === kind
            return (
              <label
                key={k.id}
                className={cn(
                  "flex cursor-pointer flex-col gap-1.5 rounded-md border-[1.5px] px-3 py-2.5 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                  on ? "border-foreground bg-card" : "border-line hover:border-line-strong"
                )}
              >
                <input type="radio" name="jenis" value={k.id} checked={on} onChange={() => setKind(k.id)} className="sr-only" />
                <span className="flex items-center gap-2 text-small font-semibold">
                  <Icon aria-hidden className={cn("size-4", on ? "text-shutter" : "text-muted-foreground")} />
                  {k.label}
                </span>
                <span className="text-caption text-muted-foreground">{k.hint}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-msg`} className="flex items-baseline justify-between text-small font-semibold">
          Ceritakan
          <span className="text-caption font-normal text-muted-foreground tabular-nums">
            {message.length}/{FEEDBACK_MAX}
          </span>
        </label>
        <textarea
          id={`${id}-msg`}
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, FEEDBACK_MAX))}
          placeholder={current.placeholder}
          className="resize-y rounded-md border-[1.5px] border-line bg-background px-3.5 py-3 text-body outline-none placeholder:text-muted-foreground focus-visible:border-foreground"
        />
        {message.length > 0 && tooShort && (
          <span className="text-caption text-muted-foreground">Minimal {FEEDBACK_MIN} karakter ya.</span>
        )}
      </div>

      <div className="grid gap-4 @xl/content:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-room`} className="text-small font-semibold">
            Kode room <span className="font-normal text-muted-foreground">(opsional)</span>
          </label>
          <input
            id={`${id}-room`}
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
            placeholder="Mis. FC8V6P"
            autoComplete="off"
            aria-invalid={!codeOk || undefined}
            className="h-12 rounded-md border-[1.5px] border-line bg-background px-3.5 font-mono text-body tracking-[0.12em] uppercase outline-none placeholder:font-sans placeholder:tracking-normal placeholder:normal-case placeholder:text-muted-foreground focus-visible:border-foreground aria-invalid:border-shutter"
          />
          <span className="text-caption text-muted-foreground">Enam huruf di layar undang, bantu kami cek bug.</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-email`} className="text-small font-semibold">
            Email <span className="font-normal text-muted-foreground">(opsional)</span>
          </label>
          <input
            id={`${id}-email`}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="kamu@email.com"
            className="h-12 rounded-md border-[1.5px] border-line bg-background px-3.5 text-body outline-none placeholder:text-muted-foreground focus-visible:border-foreground"
          />
          <span className="text-caption text-muted-foreground">Isi kalau mau kami balas.</span>
        </div>
      </div>

      {/* Jebakan bot: disembunyikan total (display:none) supaya autofill browser
          tidak mengisinya; nama yang tidak dikenali autofill. */}
      <div hidden>
        <label>
          Jangan diisi
          <input tabIndex={-1} autoComplete="off" name="bareng_hp" value={trap} onChange={(e) => setTrap(e.target.value)} />
        </label>
      </div>

      <div className="flex flex-col gap-2.5">
        <Button type="submit" disabled={tooShort || !codeOk || sending}>
          <SendIcon data-icon="inline-start" />
          {sending ? "Mengirim…" : "Kirim"}
        </Button>
        <p className="text-center text-caption text-muted-foreground">
          Kami ikut mengirim info teknis (jenis browser & perangkat) supaya masalahnya gampang dicek.
        </p>
      </div>
    </form>
  )
}
