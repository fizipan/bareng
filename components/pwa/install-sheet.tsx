"use client"

import { HouseIcon, MaximizeIcon, PlusSquareIcon, RefreshCwIcon, ShareIcon } from "lucide-react"
import { LogoMark } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { BRAND } from "@/lib/brand"
import { PWA_SCREENSHOTS } from "@/lib/pwa"
import { cn } from "@/lib/utils"
import { usePwa } from "@/stores/pwa"

const BENEFITS = [
  { icon: HouseIcon, text: "Buka langsung dari layar utama, nggak perlu cari link lagi" },
  { icon: MaximizeIcon, text: "Tampil penuh tanpa bilah browser, lebih lega buat foto" },
  { icon: RefreshCwIcon, text: "Selalu versi terbaru, kami kabari kalau ada update" },
]

const IOS_STEPS = [
  { icon: ShareIcon, text: "Ketuk tombol Bagikan di browser kamu" },
  { icon: PlusSquareIcon, text: "Pilih “Tambah ke Layar Utama”" },
  { icon: null, text: "Ketuk “Tambah”, lalu buka Bareng dari layar utama" },
]

const PREVIEWS = PWA_SCREENSHOTS.filter((s) => s.form === "narrow")

// Bottom sheet pasang aplikasi (dialog di desktop), gaya kartu app store.
export function InstallSheet() {
  const open = usePwa((s) => s.sheetOpen)
  const closeSheet = usePwa((s) => s.closeSheet)
  const desktop = useMediaQuery("(min-width: 768px)")
  const onOpenChange = (next: boolean) => {
    if (!next) closeSheet(true)
  }

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="kertas gap-5 p-6 sm:max-w-[420px]" showCloseButton={false}>
          <SheetBody desktop />
        </DialogContent>
      </Dialog>
    )
  }
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="kertas">
        <div className="mx-auto flex min-h-0 w-full max-w-[440px] flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-5 pt-3 pb-[max(24px,env(safe-area-inset-bottom))]">
          <span aria-hidden className="mx-auto h-1 w-10 rounded-full bg-line-strong" />
          <SheetBody />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function SheetBody({ desktop = false }: { desktop?: boolean }) {
  const ios = usePwa((s) => s.ios)
  const canPrompt = usePwa((s) => s.installEvent !== null)
  const install = usePwa((s) => s.install)
  const closeSheet = usePwa((s) => s.closeSheet)
  const Title = desktop ? DialogTitle : DrawerTitle
  const Description = desktop ? DialogDescription : DrawerDescription
  const showSteps = ios && !canPrompt

  return (
    <>
      <div className="flex items-center gap-3.5">
        <LogoMark size={60} />
        <div className="flex min-w-0 flex-col gap-1">
          <Title className="text-left font-display text-title leading-tight font-bold">
            {showSteps ? `Pasang ${BRAND} di iPhone` : `Pasang aplikasi ${BRAND}`}
          </Title>
          <Description className="text-left text-small text-muted-foreground">Photobooth online berdua</Description>
          <span className="flex items-center gap-1.5 text-caption text-soft-foreground">
            <span aria-hidden className="size-1.5 rounded-full bg-ok" />
            Gratis · tanpa akun · ringan
          </span>
        </div>
      </div>

      <div
        className={cn(
          "-mx-5 flex shrink-0 gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:mx-0 md:px-0",
          // Layar sangat pendek (iPhone SE): langkah pasang lebih penting dari cuplikan.
          showSteps && "[@media(max-height:640px)]:hidden"
        )}
      >
        {PREVIEWS.map((s) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={s.file}
            src={`/screenshots/${s.file}.webp`}
            alt={s.label}
            width={780}
            height={1688}
            className={cn(
              "w-auto shrink-0 rounded-[10px] border border-line bg-card",
              // Layar pendek: screenshot mengecil supaya tombol tetap terlihat.
              showSteps ? "h-[min(140px,18dvh)]" : "h-[min(196px,24dvh)] md:h-[172px]"
            )}
          />
        ))}
      </div>

      {showSteps ? (
        <ol className="flex flex-col gap-2">
          {IOS_STEPS.map((step, i) => (
            <li key={step.text} className="flex items-center gap-3 rounded-md bg-card px-3.5 py-3 text-small">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-darkroom font-display text-caption font-semibold text-kertas">
                {i + 1}
              </span>
              <span className="flex-1">{step.text}</span>
              {step.icon && <step.icon aria-hidden className="size-5 shrink-0 text-link" />}
            </li>
          ))}
        </ol>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {BENEFITS.map((b) => (
            <li key={b.text} className="flex items-center gap-3 text-small text-soft-foreground">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-foreground">
                <b.icon aria-hidden className="size-4" />
              </span>
              {b.text}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-1">
        {showSteps ? (
          <Button onClick={() => closeSheet(false)}>Oke, paham</Button>
        ) : (
          <Button onClick={() => install()}>
            <LogoMark size={20} className="rounded-[6px] ring-1 ring-kertas/40" />
            Pasang aplikasi
          </Button>
        )}
        <Button variant="ghost" className="text-label" onClick={() => closeSheet(true)}>
          Nanti aja
        </Button>
      </div>
    </>
  )
}
