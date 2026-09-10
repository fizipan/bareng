import Link from "next/link"
import { ChevronLeftIcon } from "lucide-react"
import { LogoMark } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"

export function LegalHeader({ title, updated }: { title: string; updated: string }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <Button
          variant="soft"
          size="icon"
          className="size-11"
          aria-label="Kembali ke beranda"
          render={<Link href="/" />}
          nativeButton={false}
        >
          <ChevronLeftIcon className="size-5" />
        </Button>
        <LogoMark size={24} />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[30px] leading-[1.1] font-extrabold">{title}</h1>
        <span className="text-meta text-muted-foreground">Diperbarui {updated}</span>
      </div>
    </>
  )
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="text-body font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export function LegalText({ children }: { children: React.ReactNode }) {
  return <p className="max-w-[44ch] text-small leading-[1.55] text-soft-foreground">{children}</p>
}
