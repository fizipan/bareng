"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ClockIcon, FlaskConicalIcon, LoaderCircleIcon, SparklesIcon } from "lucide-react"
import { QrisCode } from "@/components/session/qris-code"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { PREMIUM_PRICE_LABEL } from "@/lib/content/pricing"
import { daysLeft } from "@/lib/format"
import { ensureSession, supabase } from "@/lib/supabase/client"
import { notify, warn } from "@/lib/toast"

type Charge = { orderId: string; amount: number; qr: string; expiresAt: number; test: boolean }

const rupiah = (n: number) => `Rp${new Intl.NumberFormat("id-ID").format(n)}`
const clock = (ms: number) => new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(ms)

// Photostrip gratis hilang setelah 7 hari. Buat dua peserta room, tawarkan
// menyimpannya selamanya (sekali bayar, berlaku untuk berdua) langsung dari
// halaman ini — sesi foto-nya sendiri biasanya sudah lama selesai.
export function KeepForever({ slug, expiresAt }: { slug: string; expiresAt: number }) {
  const router = useRouter()
  const [member, setMember] = useState(false)
  const [charge, setCharge] = useState<Charge | null>(null)
  const [busy, setBusy] = useState(false)
  const wide = useMediaQuery("(min-width: 768px)")
  const polling = useRef<ReturnType<typeof setInterval> | null>(null)

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

  // Selama QR terbuka: cek berkala apakah hasilnya sudah jadi premium.
  useEffect(() => {
    if (!charge) return
    polling.current = setInterval(async () => {
      const { data } = await supabase().rpc("get_public_result", { p_slug: slug })
      const row = data as { watermark?: boolean } | null
      if (row && row.watermark === false) {
        setCharge(null)
        notify("Pembayaran berhasil, photostrip kalian tersimpan selamanya")
        router.refresh()
      }
    }, 3000)
    return () => {
      if (polling.current) clearInterval(polling.current)
    }
  }, [charge, slug, router])

  if (!member) return null

  const open = async () => {
    if (busy) return
    setBusy(true)
    try {
      const session = await ensureSession()
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ slug }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setCharge((await res.json()) as Charge)
    } catch {
      warn("Belum bisa membuat QR pembayaran, coba lagi")
    } finally {
      setBusy(false)
    }
  }

  const simulate = async () => {
    if (!charge) return
    await fetch("/api/payments/mock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: charge.orderId, outcome: "paid" }),
    }).catch(() => warn("Simulasi pembayaran gagal dikirim"))
  }

  const body = (
    <>
      <div className="flex flex-col items-center gap-3 rounded-md border-[1.5px] border-line bg-white px-5 pt-5 pb-4">
        {charge && <QrisCode value={charge.qr} className="size-[196px]" />}
        <div className="flex w-full items-baseline justify-between gap-3 border-t-[1.5px] border-dashed border-line pt-3">
          <span className="text-caption font-semibold tracking-[0.12em] text-muted-foreground">QRIS</span>
          <span className="font-display text-title font-semibold tabular-nums">{charge ? rupiah(charge.amount) : ""}</span>
        </div>
      </div>
      <p role="status" className="flex items-center gap-2 text-small font-semibold">
        <span aria-hidden className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-shutter/50 motion-reduce:hidden" />
          <span className="relative inline-flex size-2.5 rounded-full bg-shutter" />
        </span>
        Menunggu pembayaran…
        {charge && <span className="ml-auto font-normal text-muted-foreground">Berlaku sampai {clock(charge.expiresAt)}</span>}
      </p>
      {charge?.test && (
        <div className="flex flex-col gap-3 rounded-md border-[1.5px] border-dashed border-line-strong p-3.5">
          <p className="flex gap-2 text-small text-soft-foreground">
            <FlaskConicalIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              <span className="font-semibold text-foreground">Mode uji.</span> Belum ada uang sungguhan; coba alurnya pakai tombol
              di bawah.
            </span>
          </p>
          <Button size="sm" onClick={simulate}>
            Simulasikan bayar
          </Button>
        </div>
      )}
      <Button variant="ghost" className="text-label" onClick={() => setCharge(null)}>
        Batal
      </Button>
    </>
  )

  return (
    <div className="flex w-full animate-fade-in flex-col gap-3 rounded-md border-[1.5px] border-line-strong bg-sunken p-4 text-left @3xl:p-5">
      <span className="flex items-center gap-2 text-caption font-semibold text-shutter">
        <ClockIcon aria-hidden className="size-3.5" />
        Hilang {daysLeft(expiresAt)}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-label font-semibold">Simpan selamanya, tanpa watermark</span>
        <span className="text-small text-soft-foreground">
          Sekali bayar {PREMIUM_PRICE_LABEL} untuk kalian berdua. Photostrip ini jadi kualitas tinggi dan linknya nggak akan
          mati.
        </span>
      </span>
      <Button onClick={open} aria-busy={busy || undefined} className={busy ? "cursor-progress" : undefined}>
        {busy ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <SparklesIcon data-icon="inline-start" />}
        {busy ? "Menyiapkan QRIS…" : `Simpan selamanya · ${PREMIUM_PRICE_LABEL}`}
      </Button>

      {wide ? (
        <Dialog open={!!charge} onOpenChange={(next) => !next && setCharge(null)}>
          <DialogContent className="gap-[18px] p-6 sm:max-w-[400px]" showCloseButton={false}>
            <div className="flex flex-col gap-1.5">
              <DialogTitle className="text-display-sm">Scan untuk bayar</DialogTitle>
              <DialogDescription className="text-soft-foreground">
                Pakai aplikasi e-wallet atau m-banking yang mendukung QRIS.
              </DialogDescription>
            </div>
            {body}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={!!charge} onOpenChange={(next) => !next && setCharge(null)}>
          <DrawerContent>
            <div className="mx-auto flex min-h-0 w-full max-w-[440px] flex-1 flex-col gap-[18px] overflow-y-auto overscroll-contain px-5 pt-[22px] pb-[max(26px,env(safe-area-inset-bottom))]">
              <div className="flex flex-col gap-1.5">
                <DrawerTitle className="text-[26px] leading-tight">Scan untuk bayar</DrawerTitle>
                <DrawerDescription className="text-left text-soft-foreground">
                  Pakai aplikasi e-wallet atau m-banking yang mendukung QRIS.
                </DrawerDescription>
              </div>
              {body}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
