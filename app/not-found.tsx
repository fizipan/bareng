import Link from "next/link"
import { LostStrip } from "@/components/art/lost-strip"
import { Logo } from "@/components/brand/logo"
import { ModeRoot } from "@/components/brand/mode-root"
import { Button } from "@/components/ui/button"

// 404 umum: strip kosong, kamu & dia kebingungan mencari.
export default function NotFound() {
  return (
    <ModeRoot mode="kertas">
      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center gap-5 px-5 pt-3 pb-10 text-center">
        <Link href="/" aria-label="Beranda" className="self-start rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Logo size={28} wordmarkClassName="text-[19px]" />
        </Link>
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <LostStrip />
          <h1 className="font-display text-display-md font-semibold">Halaman ini nggak ada</h1>
          <p className="max-w-[34ch] text-body text-muted-foreground">Mungkin link-nya salah ketik, atau halamannya sudah dipindah.</p>
          <Button className="w-full" render={<Link href="/" />} nativeButton={false}>
            Ke beranda
          </Button>
        </div>
      </main>
    </ModeRoot>
  )
}
