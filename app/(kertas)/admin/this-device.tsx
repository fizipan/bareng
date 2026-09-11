"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRightIcon, BadgeCheckIcon, LoaderCircleIcon, PresentationIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ensureSession, supabase } from "@/lib/supabase/client"
import { warn } from "@/lib/toast"

// Status browser ini: sudah perangkat demo atau belum. Sesi anonimnya sama
// dengan yang dipakai waktu foto, jadi mendaftarkan di sini = HP ini yang aktif.
export function ThisDevice({
  ids,
  defaultLabel,
  enable,
}: {
  ids: string[]
  defaultLabel: string
  enable: (token: string, label: string) => Promise<{ ok: boolean }>
}) {
  // undefined = masih memeriksa; null = belum pernah punya sesi.
  const [me, setMe] = useState<string | null | undefined>(undefined)
  const [label, setLabel] = useState(defaultLabel)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    supabase()
      .auth.getSession()
      .then(({ data }) => {
        if (alive) setMe(data.session?.user.id ?? null)
      })
    return () => {
      alive = false
    }
  }, [])

  const active = !!me && ids.includes(me)

  const register = async () => {
    if (busy) return
    setBusy(true)
    try {
      const session = await ensureSession()
      const res = await enable(session.access_token, label.trim() || defaultLabel)
      if (!res.ok) throw new Error("gagal")
      setMe(session.user.id)
    } catch {
      warn("Belum bisa mendaftarkan perangkat ini, coba lagi")
    } finally {
      setBusy(false)
    }
  }

  if (me === undefined) {
    return (
      <div className="flex min-h-[132px] items-center gap-2.5 rounded-md border-[1.5px] border-line bg-sunken px-5 text-small text-muted-foreground">
        <LoaderCircleIcon aria-hidden className="size-4 animate-spin" />
        Memeriksa perangkat ini…
      </div>
    )
  }

  if (active) {
    return (
      <div className="flex flex-col gap-4 rounded-md border-[1.5px] border-ok/40 bg-sunken p-5">
        <div className="flex items-start gap-3">
          <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-ok/15 text-ok">
            <BadgeCheckIcon className="size-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-label font-semibold">Perangkat ini sudah perangkat demo</span>
            <span className="text-small text-muted-foreground">
              Room yang kamu buat dari browser ini langsung premium dan tanpa batas harian.
            </span>
          </div>
        </div>
        <Button className="self-start" render={<Link href="/" />} nativeButton={false}>
          Mulai foto bareng
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border-[1.5px] border-line-strong bg-sunken p-5">
      <div className="flex items-start gap-3">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-card text-soft-foreground">
          <PresentationIcon className="size-5" />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-label font-semibold">Jadikan perangkat ini perangkat demo</span>
          <span className="text-small text-muted-foreground">
            Buka halaman ini di HP atau laptop yang mau dipakai demo, lalu daftarkan dari sana.
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-caption font-semibold text-soft-foreground">Nama perangkat</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={80}
            placeholder={defaultLabel}
            className="h-12 w-full rounded-md border-[1.5px] border-line bg-background px-3.5 text-body outline-none transition-colors focus-visible:border-foreground"
          />
        </label>
        <Button onClick={register} aria-busy={busy || undefined} className={busy ? "cursor-progress" : undefined}>
          {busy ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <BadgeCheckIcon data-icon="inline-start" />}
          Jadikan perangkat demo
        </Button>
      </div>
    </div>
  )
}
