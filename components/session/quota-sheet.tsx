"use client"

import { useState } from "react"
import { LoaderCircleIcon, SparklesIcon, UsersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { SITE_HOST } from "@/lib/brand"
import { FREE_SESSIONS_PER_DAY, PREMIUM_PRICE_LABEL } from "@/lib/content/pricing"
import { warn } from "@/lib/toast"
import { closeQuota, useQuota } from "@/stores/quota"

const TITLE = "Sesi gratis hari ini habis"
const DESCRIPTION = `Kamu sudah foto bareng ${FREE_SESSIONS_PER_DAY}× hari ini. Kuota gratis balik lagi besok jam 00.00 WIB.`

// Kuota gratis habis: jelaskan, lalu arahkan ke sesi premium (bayar di dalam
// room sebelum mulai) atau minta pasangan yang bikin room. Dialog di desktop,
// bottom sheet di HP, selalu Kertas.
export function QuotaSheet() {
  const open = useQuota((s) => s.open)
  const wide = useMediaQuery("(min-width: 768px)")
  const onOpenChange = (next: boolean) => {
    if (!next) closeQuota()
  }

  if (wide) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="kertas gap-[18px] p-6 sm:max-w-[420px]" showCloseButton={false}>
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-display-sm">{TITLE}</DialogTitle>
            <DialogDescription className="text-soft-foreground">{DESCRIPTION}</DialogDescription>
          </div>
          <QuotaBody />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="kertas">
        <div className="mx-auto flex min-h-0 w-full max-w-[440px] flex-1 flex-col gap-[18px] overflow-y-auto overscroll-contain px-5 pt-[22px] pb-[max(26px,env(safe-area-inset-bottom))]">
          <div className="flex flex-col gap-1.5">
            <DrawerTitle className="text-[26px] leading-tight">{TITLE}</DrawerTitle>
            <DrawerDescription className="text-left text-soft-foreground">{DESCRIPTION}</DrawerDescription>
          </div>
          <QuotaBody />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function QuotaBody() {
  const start = useQuota((s) => s.start)
  const [busy, setBusy] = useState(false)

  const go = async () => {
    if (busy || !start) return
    setBusy(true)
    try {
      await start()
      closeQuota()
    } catch {
      warn("Belum bisa bikin room, coba lagi sebentar")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3.5 rounded-md border-[1.5px] border-foreground/70 bg-sunken p-4">
        <div className="flex items-start gap-3">
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-flash/30 text-[#7A5E00]">
            <SparklesIcon className="size-[18px]" />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-label font-semibold">Lanjut sebagai sesi premium</span>
            <span className="text-small text-soft-foreground">
              {PREMIUM_PRICE_LABEL} sekali untuk kalian berdua: semua template, tanpa watermark, HD. Bayar pakai QRIS di dalam room,
              sebelum mulai foto.
            </span>
          </div>
        </div>
        {/* Saat menyiapkan room tombol tetap berwarna (bukan abu-abu). */}
        <Button onClick={go} aria-busy={busy || undefined} className={busy ? "cursor-progress" : undefined}>
          {busy ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <SparklesIcon data-icon="inline-start" />}
          {busy ? "Menyiapkan booth…" : `Lanjut premium · ${PREMIUM_PRICE_LABEL}`}
        </Button>
      </div>

      <div className="flex items-start gap-3 rounded-md bg-card p-4">
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-background text-soft-foreground">
          <UsersIcon className="size-[18px]" />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-label font-semibold">Minta dia yang buat room</span>
          <span className="text-small text-soft-foreground">
            Kuota dia terpisah. Dia buka {SITE_HOST}, tekan “Mulai foto bareng”, lalu kirim link-nya ke kamu.
          </span>
        </div>
      </div>

      <Button variant="ghost" className="text-label" onClick={closeQuota} disabled={busy}>
        Nanti saja
      </Button>
    </div>
  )
}
