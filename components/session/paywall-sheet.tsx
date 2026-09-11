"use client"

import { useEffect, useState } from "react"
import { CircleAlertIcon, FlaskConicalIcon, LoaderCircleIcon, QrCodeIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { SITE_HOST } from "@/lib/brand"
import { PREMIUM_PRICE_LABEL } from "@/lib/content/pricing"
import type { PaywallCharge } from "@/lib/session/types"
import { getTemplate } from "@/lib/templates/builtin"
import { lookBackground } from "@/lib/templates/placeholder"
import { cn } from "@/lib/utils"
import { useSession } from "@/stores/session"
import { useFrame } from "./frame-context"
import { QrisCode } from "./qris-code"

const rupiah = (n: number) => `Rp${new Intl.NumberFormat("id-ID").format(n)}`
const clock = (ms: number) => new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(ms)

// Judul & keterangan per langkah (tawar → QRIS → gagal).
function useCopy() {
  const step = useSession((s) => s.paywall.step)
  const pending = useSession((s) => s.paywall.pendingTemplateId)
  if (step === "qris") {
    return { title: "Scan untuk bayar", description: "Pakai aplikasi e-wallet atau m-banking yang mendukung QRIS." }
  }
  if (step === "gagal") {
    return { title: "Pembayaran belum berhasil", description: "Tidak ada yang berubah, foto kalian tetap aman." }
  }
  return {
    title: pending ? `${getTemplate(pending).name} khusus premium` : "Simpan tanpa watermark",
    description: "Semua template, kualitas tinggi, tersimpan selamanya. Satu bayar buat kalian berdua.",
  }
}

// Paywall PRD §15.5: bottom sheet di mobile, dialog di desktop, selalu Kertas.
// Tanpa countdown palsu atau urgensi buatan (masa berlaku QR ditulis apa adanya).
export function PaywallSheet() {
  const open = useSession((s) => s.paywall.open)
  const closePaywall = useSession((s) => s.closePaywall)
  const frame = useFrame()
  const wide = useMediaQuery("(min-width: 768px)")
  const desktop = wide && !frame
  const { title, description } = useCopy()

  const onOpenChange = (next: boolean) => {
    if (!next) closePaywall()
  }

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="kertas gap-[18px] p-6 sm:max-w-[400px]" showCloseButton={false}>
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-display-sm">{title}</DialogTitle>
            <DialogDescription className="max-w-[40ch] text-soft-foreground">{description}</DialogDescription>
          </div>
          <PaywallBody mobile={false} />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="kertas" container={frame?.container}>
        <div className="mx-auto flex min-h-0 w-full max-w-[440px] flex-1 flex-col gap-[18px] overflow-y-auto overscroll-contain px-5 pt-[22px] pb-[max(26px,env(safe-area-inset-bottom))]">
          <div className="flex flex-col gap-1.5">
            <DrawerTitle className="text-[26px] leading-tight">{title}</DrawerTitle>
            <DrawerDescription className="max-w-[40ch] text-left text-soft-foreground">{description}</DrawerDescription>
          </div>
          <PaywallBody mobile />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function PaywallBody({ mobile }: { mobile: boolean }) {
  const step = useSession((s) => s.paywall.step)
  const charge = useSession((s) => s.paywall.charge)
  if (step === "qris" && charge) return <QrisStep key={charge.orderId} charge={charge} mobile={mobile} />
  if (step === "gagal") return <FailedStep />
  return <OfferStep />
}

function OfferStep() {
  const loading = useSession((s) => s.paywall.step === "memuat")
  const pay = useSession((s) => s.pay)
  const closePaywall = useSession((s) => s.closePaywall)

  return (
    <>
      <div className="flex justify-center gap-4" aria-hidden>
        <CompareStrip label="Gratis" watermark />
        <CompareStrip label="Premium" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-display-md font-semibold">{PREMIUM_PRICE_LABEL}</span>
        <span className="text-small text-muted-foreground">sekali, untuk sesi ini</span>
      </div>
      <div className="flex flex-col gap-1">
        {/* Saat menyiapkan QR tombol tetap berwarna (bukan abu-abu); klik ganda dicegah store. */}
        <Button onClick={pay} aria-busy={loading || undefined} className={cn(loading && "cursor-progress")}>
          {loading ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <QrCodeIcon data-icon="inline-start" />}
          {loading ? "Menyiapkan QRIS…" : `Bayar ${PREMIUM_PRICE_LABEL}`}
        </Button>
        <Button variant="ghost" className="text-label" onClick={closePaywall} disabled={loading}>
          Lanjut dengan watermark
        </Button>
      </div>
    </>
  )
}

function QrisStep({ charge, mobile }: { charge: PaywallCharge; mobile: boolean }) {
  const simulating = useSession((s) => s.paywall.simulating)
  const simulatePayment = useSession((s) => s.simulatePayment)
  const pay = useSession((s) => s.pay)
  const closePaywall = useSession((s) => s.closePaywall)
  const [expired, setExpired] = useState(false)

  // QR punya masa berlaku sungguhan dari gateway; setelah lewat, minta QR baru.
  useEffect(() => {
    const t = setTimeout(() => setExpired(true), Math.max(0, charge.expiresAt - Date.now()))
    return () => clearTimeout(t)
  }, [charge.expiresAt])

  return (
    <>
      <div className="flex flex-col items-center gap-3 rounded-md border-[1.5px] border-line bg-white px-5 pt-5 pb-4">
        <div className="relative">
          <QrisCode value={charge.qr} className={cn("size-[196px] transition-opacity", expired && "opacity-15")} />
          {expired && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
              <span className="text-label font-semibold">QR sudah kedaluwarsa</span>
              <Button size="sm" onClick={pay}>
                <RefreshCwIcon data-icon="inline-start" />
                Buat QR baru
              </Button>
            </div>
          )}
        </div>
        <div className="flex w-full items-baseline justify-between gap-3 border-t-[1.5px] border-dashed border-line pt-3">
          <span className="text-caption font-semibold tracking-[0.12em] text-muted-foreground">QRIS</span>
          <span className="font-display text-title font-semibold tabular-nums">{rupiah(charge.amount)}</span>
        </div>
      </div>

      {!expired && (
        <div className="flex flex-col gap-1.5">
          <p role="status" className="flex items-center gap-2 text-small font-semibold">
            <span aria-hidden className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-shutter/50 motion-reduce:hidden" />
              <span className="relative inline-flex size-2.5 rounded-full bg-shutter" />
            </span>
            Menunggu pembayaran…
            <span className="ml-auto font-normal text-muted-foreground">Berlaku sampai {clock(charge.expiresAt)}</span>
          </p>
          <p className="text-small text-soft-foreground">
            Begitu lunas, dua HP otomatis jadi premium.
            {mobile && " Bayar dari HP ini? Screenshot QR-nya, lalu pilih dari galeri di aplikasi e-wallet."}
          </p>
        </div>
      )}

      {charge.test && !expired && (
        <div className="flex flex-col gap-3 rounded-md border-[1.5px] border-dashed border-line-strong p-3.5">
          <p className="flex gap-2 text-small text-soft-foreground">
            <FlaskConicalIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              <span className="font-semibold text-foreground">Mode uji.</span> Belum ada uang sungguhan; coba alurnya pakai tombol
              di bawah.
            </span>
          </p>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={() => simulatePayment("paid")} aria-busy={simulating || undefined}>
              {simulating && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
              Simulasikan bayar
            </Button>
            <Button size="sm" variant="soft" onClick={() => simulatePayment("failed")} disabled={simulating}>
              Simulasikan gagal
            </Button>
          </div>
        </div>
      )}

      <Button variant="ghost" className="text-label" onClick={closePaywall}>
        Batal
      </Button>
    </>
  )
}

function FailedStep() {
  const pay = useSession((s) => s.pay)
  const closePaywall = useSession((s) => s.closePaywall)
  return (
    <>
      <p className="flex gap-2.5 rounded-md bg-shutter/8 p-3.5 text-small text-soft-foreground">
        <CircleAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-shutter" />
        Tagihan ini tidak jadi. Coba lagi dengan QR baru, atau lanjut dulu dengan watermark.
      </p>
      <div className="flex flex-col gap-1">
        <Button onClick={pay}>
          <RefreshCwIcon data-icon="inline-start" />
          Coba lagi
        </Button>
        <Button variant="ghost" className="text-label" onClick={closePaywall}>
          Lanjut dengan watermark
        </Button>
      </div>
    </>
  )
}

function CompareStrip({ label, watermark = false }: { label: string; watermark?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex w-[88px] flex-col gap-1 border border-line bg-white px-1.5 pt-1.5 pb-[18px]">
        {[0, 1, 0].map((look, i) => (
          <span key={i} className="block h-[34px]" style={{ background: lookBackground(look, i % 2 ? "b" : "a") }} />
        ))}
        {watermark && <span className="absolute right-[5px] bottom-[5px] text-[7px] text-grain">{SITE_HOST}</span>}
      </div>
      <span className={cn("text-caption", watermark ? "text-muted-foreground" : "text-foreground")}>{label}</span>
    </div>
  )
}
