"use client"

import { RotateCcwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useFrame } from "./frame-context"
import { guideFor } from "./permission-guide"

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
  const guide = guideFor("Kamera")
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
