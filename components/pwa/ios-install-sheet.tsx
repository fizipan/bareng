"use client"

import { PlusSquareIcon, ShareIcon } from "lucide-react"
import { LogoMark } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { usePwa } from "@/stores/pwa"

const STEPS = [
  { icon: ShareIcon, text: "Ketuk tombol Bagikan di browser kamu" },
  { icon: PlusSquareIcon, text: "Pilih “Tambah ke Layar Utama”" },
  { icon: null, text: "Ketuk “Tambah”, lalu buka Bareng dari layar utama" },
]

// iOS tidak punya prompt pasang otomatis, jadi kita tunjukkan caranya.
export function IosInstallSheet() {
  const open = usePwa((s) => s.iosSheetOpen)
  const setOpen = usePwa((s) => s.setIosSheetOpen)

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="kertas">
        <div className="mx-auto flex w-full max-w-[440px] flex-col gap-5 px-5 pt-6 pb-[max(26px,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3">
            <LogoMark size={44} />
            <div className="flex flex-col gap-0.5">
              <DrawerTitle className="text-left text-title">Pasang Bareng di iPhone</DrawerTitle>
              <DrawerDescription className="text-left">Buka langsung dari layar utama, tanpa cari link lagi.</DrawerDescription>
            </div>
          </div>
          <ol className="flex flex-col gap-2.5">
            {STEPS.map((step, i) => (
              <li key={step.text} className="flex items-center gap-3 rounded-md bg-card px-3.5 py-3 text-small">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-darkroom font-display text-caption font-semibold text-kertas">
                  {i + 1}
                </span>
                <span className="flex-1">{step.text}</span>
                {step.icon && <step.icon aria-hidden className="size-5 shrink-0 text-link" />}
              </li>
            ))}
          </ol>
          <DrawerClose render={<Button />}>Oke, paham</DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
