"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowUpRightIcon, MessageCircleQuestionIcon } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { FeedbackForm } from "./feedback-form"

// Tombol bantuan melayang (kanan bawah) → modal form masukan/bug. Modal, bukan
// pindah halaman, supaya sesi foto yang sedang jalan tidak terputus; di dalam
// sesi kode room terisi otomatis. Posisi naik di atas bar yang menempel &
// disembunyikan di layar capture (globals.css, [data-help-fab]). Di landing baru
// muncul setelah melewati hero, supaya tidak menutupi tombol utama.
const onScroll = (cb: () => void) => {
  window.addEventListener("scroll", cb, { passive: true })
  window.addEventListener("resize", cb)
  return () => {
    window.removeEventListener("scroll", cb)
    window.removeEventListener("resize", cb)
  }
}
const pastHero = () => window.scrollY > window.innerHeight * 0.9

export function HelpFab() {
  const pathname = usePathname()
  const wide = useMediaQuery("(min-width: 768px)")
  const [open, setOpen] = useState(false)
  const scrolled = useSyncExternalStore(onScroll, pastHero, () => false)

  if (/^\/(bantuan|admin|dev)(\/|$)/.test(pathname)) return null
  const room = pathname.match(/^\/r\/([A-Z0-9]{6})/)?.[1] ?? null
  const inSession = !!room
  const tucked = pathname === "/" && !scrolled && !open

  const body = (Title: typeof DialogTitle, Description: typeof DialogDescription) => (
    <>
      <div className="flex flex-col gap-1">
        <Title className="text-left text-display-sm">Butuh bantuan?</Title>
        <Description className="text-left text-soft-foreground">
          Nemu bug, punya ide, atau bingung? Ceritain ke kami{inSession ? ", sesi fotomu tetap jalan." : "."}
        </Description>
      </div>
      <FeedbackForm bare initialRoom={room} />
      <Link
        href="/bantuan"
        target={inSession ? "_blank" : undefined}
        className="inline-flex min-h-11 items-center justify-center gap-1 text-small text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        onClick={() => !inSession && setOpen(false)}
      >
        Lihat masalah umum di Pusat bantuan
        <ArrowUpRightIcon aria-hidden className="size-3.5" />
      </Link>
    </>
  )

  return (
    <>
      <button
        type="button"
        data-help-fab
        onClick={() => setOpen(true)}
        aria-label="Bantuan & kirim masukan"
        aria-hidden={tucked || undefined}
        tabIndex={tucked ? -1 : undefined}
        className={cn(
          "fixed right-4 bottom-[calc(16px+env(safe-area-inset-bottom))] z-40 grid size-12 cursor-pointer place-items-center rounded-full bg-darkroom text-kertas shadow-[0_8px_20px_rgb(22_20_29/0.3)] ring-1 ring-kertas/15 transition-[transform,opacity,bottom] duration-200 outline-none hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/60 active:scale-95",
          tucked && "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        <MessageCircleQuestionIcon aria-hidden className="size-[22px]" />
      </button>
      {wide ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="kertas gap-5 p-6 sm:max-w-[480px]">{body(DialogTitle, DialogDescription)}</DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="kertas">
            <div className="mx-auto flex min-h-0 w-full max-w-[440px] flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-5 pt-[22px] pb-[max(20px,env(safe-area-inset-bottom))]">
              {body(DrawerTitle as typeof DialogTitle, DrawerDescription as typeof DialogDescription)}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  )
}
