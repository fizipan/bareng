"use client"

import { QrCodeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { SITE_HOST } from "@/lib/brand"
import { PREMIUM_PRICE_LABEL } from "@/lib/content/pricing"
import { lookBackground } from "@/lib/templates/placeholder"
import { cn } from "@/lib/utils"
import { useSession } from "@/stores/session"
import { useFrame } from "./frame-context"

const TITLE = "Simpan tanpa watermark"
const DESCRIPTION = "Semua template, kualitas tinggi, tersimpan selamanya. Satu bayar buat kalian berdua."

// Paywall PRD §15.5: bottom sheet di mobile, dialog di desktop, selalu Kertas.
// Tanpa countdown palsu atau urgensi buatan.
export function PaywallSheet() {
  const open = useSession((s) => s.paywall.open)
  const closePaywall = useSession((s) => s.closePaywall)
  const frame = useFrame()
  const wide = useMediaQuery("(min-width: 768px)")
  const desktop = wide && !frame

  const onOpenChange = (next: boolean) => {
    if (!next) closePaywall()
  }

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="kertas gap-[18px] p-6 sm:max-w-[400px]" showCloseButton={false}>
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-display-sm">{TITLE}</DialogTitle>
            <DialogDescription className="max-w-[40ch] text-soft-foreground">{DESCRIPTION}</DialogDescription>
          </div>
          <PaywallBody />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="kertas" container={frame?.container}>
        <div className="mx-auto flex min-h-0 w-full max-w-[440px] flex-1 flex-col gap-[18px] overflow-y-auto overscroll-contain px-5 pt-[22px] pb-[max(26px,env(safe-area-inset-bottom))]">
          <div className="flex flex-col gap-1.5">
            <DrawerTitle className="text-[26px] leading-tight">{TITLE}</DrawerTitle>
            <DrawerDescription className="max-w-[40ch] text-left text-soft-foreground">{DESCRIPTION}</DrawerDescription>
          </div>
          <PaywallBody />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function PaywallBody() {
  const paying = useSession((s) => s.paywall.paying)
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
        <Button onClick={pay} disabled={paying}>
          <QrCodeIcon data-icon="inline-start" />
          {paying ? "Menunggu pembayaran QRIS…" : `Bayar ${PREMIUM_PRICE_LABEL}`}
        </Button>
        <Button variant="ghost" className="text-label" onClick={closePaywall} disabled={paying}>
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
