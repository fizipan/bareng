"use client"

import { RotateCcwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useFrame } from "./frame-context"

type Guide = { browser: string; steps: string[]; note?: string }

// Panduan menyalakan izin kamera per browser (PRD R2). Deteksi kasar dari
// user agent; kalau tidak dikenali, langkah umum Chrome/Edge.
function guideFor(ua: string, touch: boolean): Guide {
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && touch)
  if (ios && /CriOS|FxiOS|EdgiOS/.test(ua)) {
    return {
      browser: "Browser di iPhone",
      steps: ["Buka Pengaturan iPhone, cari aplikasi browser ini.", "Nyalakan Kamera.", "Balik ke sini, lalu coba lagi."],
    }
  }
  if (ios) {
    return {
      browser: "Safari di iPhone",
      steps: [
        "Ketuk ikon aA (atau ⋯) di sebelah alamat web.",
        "Pilih Pengaturan Situs Web, lalu ubah Kamera jadi Izinkan.",
        "Muat ulang halaman ini.",
      ],
      note: "Masih diblokir? Buka Pengaturan iPhone → Apps → Safari → Kamera → Izinkan.",
    }
  }
  if (/SamsungBrowser/.test(ua)) {
    return {
      browser: "Samsung Internet",
      steps: ["Ketuk ikon gembok di kiri alamat web.", "Pilih Izin, lalu nyalakan Kamera.", "Balik ke sini, lalu coba lagi."],
    }
  }
  if (/Android/.test(ua)) {
    return {
      browser: "Chrome di Android",
      steps: [
        "Ketuk ikon di kiri alamat web (gembok atau setelan).",
        "Pilih Izin → Kamera → Izinkan.",
        "Balik ke sini, lalu coba lagi.",
      ],
      note: "Masih diblokir? Buka Setelan HP → Aplikasi → Chrome → Izin → Kamera → Izinkan.",
    }
  }
  if (/Firefox/.test(ua)) {
    return {
      browser: "Firefox",
      steps: ["Klik ikon kamera bercoret di kolom alamat.", "Hapus blokir kamera untuk situs ini.", "Coba lagi."],
    }
  }
  if (/Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua)) {
    return {
      browser: "Safari di Mac",
      steps: ["Buka menu Safari → Pengaturan untuk situs ini.", "Ubah Kamera jadi Izinkan.", "Coba lagi."],
    }
  }
  return {
    browser: "Chrome / Edge",
    steps: ["Klik ikon di kiri alamat web.", "Ubah Kamera jadi Izinkan.", "Coba lagi."],
  }
}

const TITLE = "Cara menyalakan kamera"

export function CameraHelpSheet({
  open,
  onOpenChange,
  onRetry,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRetry: () => void
}) {
  const frame = useFrame()
  const wide = useMediaQuery("(min-width: 768px)")
  const desktop = wide && !frame

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="kertas gap-5 p-6 sm:max-w-[400px]" showCloseButton={false}>
          <HelpBody desktop onRetry={onRetry} />
        </DialogContent>
      </Dialog>
    )
  }
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="kertas" container={frame?.container}>
        <div className="mx-auto flex min-h-0 w-full max-w-[440px] flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-5 pt-[22px] pb-[max(26px,env(safe-area-inset-bottom))]">
          <HelpBody onRetry={onRetry} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function HelpBody({ desktop = false, onRetry }: { desktop?: boolean; onRetry: () => void }) {
  const guide = guideFor(navigator.userAgent, navigator.maxTouchPoints > 1)
  const Title = desktop ? DialogTitle : DrawerTitle
  const Description = desktop ? DialogDescription : DrawerDescription

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Title className="text-left text-display-sm">{TITLE}</Title>
        <Description className="text-left text-soft-foreground">{guide.browser}</Description>
      </div>
      <ol className="flex flex-col gap-3">
        {guide.steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3 text-body">
            <span
              aria-hidden
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-shutter font-display text-caption font-semibold text-kertas"
            >
              {i + 1}
            </span>
            <span className="pt-px">{step}</span>
          </li>
        ))}
      </ol>
      {guide.note && <p className="text-small text-muted-foreground">{guide.note}</p>}
      <div className="flex flex-col gap-2.5">
        <Button onClick={onRetry}>
          <RotateCcwIcon data-icon="inline-start" />
          Sudah, coba lagi
        </Button>
        <Button variant="ghost" className="text-label" onClick={() => window.location.reload()}>
          Muat ulang halaman
        </Button>
      </div>
    </>
  )
}
