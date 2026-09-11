"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  ClockIcon,
  InfinityIcon,
  LoaderCircleIcon,
  SendIcon,
  SparklesIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SUPPORT_EMAIL } from "@/lib/brand"
import { collectDeviceInfo } from "@/lib/device-info"
import { ensureSession, supabase } from "@/lib/supabase/client"
import { warn } from "@/lib/toast"
import { cn } from "@/lib/utils"

type Status = "memuat" | "none" | "pending" | "approved" | "rejected" | "expired"

const PERKS = [
  { icon: InfinityIcon, text: "Foto bareng tanpa batas 3 sesi per hari" },
  { icon: SparklesIcon, text: "Semua template, tanpa watermark, kualitas HD" },
]

const date = (ms: number) => new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }).format(ms)

const field =
  "h-12 w-full rounded-md border-[1.5px] border-line bg-background px-3.5 text-body outline-none transition-colors focus-visible:border-foreground"

// Status perangkat ini. Sesi anonim tidak dibuat hanya karena membuka halaman
// ini; baru dibuat saat permintaan dikirim.
async function fetchStatus(): Promise<{ status: Status; until?: number | null }> {
  const { data } = await supabase().auth.getSession()
  if (!data.session) return { status: "none" }
  const { data: row } = await supabase().rpc("demo_status")
  return (row ?? { status: "none" }) as { status: Status; until?: number | null }
}

// Halaman /demo: minta akses demo untuk perangkat ini, lalu tunggu disetujui
// admin. Yang disetujui adalah sesi anonim browser ini, bukan akun.
export function DemoAccess() {
  const [status, setStatus] = useState<Status>("memuat")
  const [until, setUntil] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState("")
  const [contact, setContact] = useState("")
  const [note, setNote] = useState("")

  const show = (res: { status: Status; until?: number | null }) => {
    setStatus(res.status)
    setUntil(res.until ?? null)
  }

  useEffect(() => {
    let alive = true
    fetchStatus()
      .then((res) => alive && show(res))
      .catch(() => alive && setStatus("none"))
    return () => {
      alive = false
    }
  }, [])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy || name.trim().length < 2) return
    setBusy(true)
    try {
      const [session, meta] = await Promise.all([ensureSession(), collectDeviceInfo().catch(() => ({}))])
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ name, contact, note, meta }),
      })
      if (!res.ok) throw new Error("gagal")
      const data = (await res.json()) as { status?: Status }
      setStatus(data.status === "approved" ? "approved" : "pending")
    } catch {
      warn("Belum bisa mengirim permintaan, coba lagi sebentar")
    } finally {
      setBusy(false)
    }
  }

  if (status === "memuat") {
    return (
      <p className="flex min-h-[160px] items-center justify-center gap-2.5 text-small text-muted-foreground">
        <LoaderCircleIcon aria-hidden className="size-4 animate-spin" />
        Memeriksa perangkat ini…
      </p>
    )
  }

  if (status === "approved") {
    return (
      <Card
        tone="ok"
        icon={BadgeCheckIcon}
        title="Perangkat ini sudah bisa demo"
        body={
          until
            ? `Berlaku sampai ${date(until)}. Buat room dari HP ini, lalu ajak orangnya masuk lewat link.`
            : "Tanpa batas waktu. Buat room dari HP ini, lalu ajak orangnya masuk lewat link."
        }
      >
        <Button render={<Link href="/" />} nativeButton={false} className="self-start">
          Mulai foto bareng
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </Card>
    )
  }

  if (status === "pending") {
    return (
      <Card
        tone="wait"
        icon={ClockIcon}
        title="Permintaan sudah masuk"
        body="Kami cek dulu ya. Kalau sudah disetujui, halaman ini berubah sendiri — cukup buka lagi dari HP yang sama."
      >
        <Button
          variant="secondary"
          onClick={() => void fetchStatus().then(show, () => warn("Belum bisa memeriksa status, coba lagi"))}
          className="self-start"
        >
          Cek status
        </Button>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {status === "rejected" && (
        <Card
          tone="plain"
          icon={ClockIcon}
          title="Permintaan sebelumnya belum disetujui"
          body={`Kalau menurutmu ini keliru, kabari kami di ${SUPPORT_EMAIL}. Kamu juga boleh kirim permintaan lagi dengan keterangan lebih jelas.`}
        />
      )}
      {status === "expired" && (
        <Card tone="plain" icon={ClockIcon} title="Akses demo sudah berakhir" body="Kirim permintaan lagi kalau masih butuh." />
      )}

      <ul className="flex flex-col gap-2">
        {PERKS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-2.5 text-small text-soft-foreground">
            <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            {text}
          </li>
        ))}
      </ul>

      <form onSubmit={send} className="flex flex-col gap-4 rounded-md border-[1.5px] border-line-strong bg-sunken p-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-caption font-semibold text-soft-foreground">Nama kamu</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} className={field} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-caption font-semibold text-soft-foreground">
            WhatsApp atau email <span className="font-normal text-muted-foreground">(opsional)</span>
          </span>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            maxLength={80}
            inputMode="email"
            placeholder="Biar kami bisa kabari"
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-caption font-semibold text-soft-foreground">
            Buat apa? <span className="font-normal text-muted-foreground">(opsional)</span>
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="Misalnya: mau tunjukkan ke calon klien wedding"
            className={cn(field, "h-auto resize-none py-3 leading-relaxed")}
          />
        </label>
        <Button type="submit" aria-busy={busy || undefined} className={busy ? "cursor-progress" : undefined}>
          {busy ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <SendIcon data-icon="inline-start" />}
          {busy ? "Mengirim…" : "Kirim permintaan"}
        </Button>
        <p className="text-caption text-muted-foreground">
          Yang disetujui adalah HP/browser ini. Kalau nanti mau demo dari perangkat lain, buka halaman ini dari perangkat itu.
        </p>
      </form>
    </div>
  )
}

function Card({
  tone,
  icon: Icon,
  title,
  body,
  children,
}: {
  tone: "ok" | "wait" | "plain"
  icon: typeof ClockIcon
  title: string
  body: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-md border-[1.5px] bg-sunken p-5",
        tone === "ok" ? "border-ok/40" : tone === "wait" ? "border-line-strong" : "border-line"
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-full",
            tone === "ok" ? "bg-ok/15 text-ok" : "bg-card text-soft-foreground"
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-label font-semibold">{title}</span>
          <span className="text-small text-muted-foreground">{body}</span>
        </div>
      </div>
      {children}
    </div>
  )
}
