import Link from "next/link"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"

// Placeholder M0 — landing lengkap dibangun di M1.
export default function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center gap-6 px-5 py-10">
      <Logo tagline="photobooth berdua" />
      <h1 className="font-display text-hero font-extrabold tracking-[-0.01em]">Foto bareng, walau jauh.</h1>
      <p className="max-w-[34ch] text-body text-soft-foreground">
        Photobooth online untuk kamu dan dia. Buka link, hitung mundur bareng, jadi.
      </p>
      <Button render={<Link href="/dev" />} nativeButton={false}>
        Lihat design system
      </Button>
    </main>
  )
}
