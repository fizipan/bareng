import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { DemoAccess } from "@/components/demo/demo-access"

export const metadata: Metadata = {
  title: "Akses demo",
  description: "Minta akses demo Bareng untuk perangkat ini.",
  robots: { index: false, follow: false },
}

// Halaman permintaan akses demo. Tidak ditautkan dari mana pun: linknya
// dibagikan langsung ke orang yang mau mendemokan Bareng.
export default function DemoPage() {
  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col gap-7 px-5 py-8 sm:py-12">
      <div className="flex items-center justify-between gap-3">
        <Logo size={26} wordmarkClassName="text-[18px]" />
        <span className="rounded-full bg-card px-2.5 py-1 text-caption font-semibold text-soft-foreground">Akses demo</span>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display-sm font-bold sm:text-display-md">Mau pakai Bareng buat demo?</h1>
        <p className="text-body text-soft-foreground">
          Kirim permintaan dari HP atau laptop yang mau dipakai. Setelah kami setujui, perangkat itu bisa foto bareng tanpa batas
          harian dan hasilnya langsung premium.
        </p>
      </div>

      <DemoAccess />

      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-1.5 self-start text-small text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeftIcon aria-hidden className="size-4" />
        Kembali ke Bareng
      </Link>
    </main>
  )
}
