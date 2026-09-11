import Link from "next/link"
import { ChevronLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LegalToc, type TocItem } from "./legal-toc"

const PAGES = [
  { key: "privasi", label: "Privasi", href: "/privasi" },
  { key: "ketentuan", label: "Ketentuan", href: "/ketentuan" },
] as const

// Kerangka halaman Privasi & Ketentuan. Responsif lewat container query supaya
// tampil benar juga di bingkai HP /dev/screens. Desktop lebar: daftar isi
// menempel di kiri, isi di kanan.
export function LegalLayout({
  page,
  title,
  lede,
  updated,
  art,
  toc,
  children,
}: {
  page: (typeof PAGES)[number]["key"]
  title: string
  lede: string
  updated: string
  art: React.ReactNode
  toc: TocItem[]
  children: React.ReactNode
}) {
  return (
    <div className="@container flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-[560px] flex-col gap-8 px-5 pt-2 pb-12 @3xl:gap-12 @3xl:px-10 @3xl:pt-6 @3xl:pb-20 @5xl:max-w-[1040px]">
        <header className="flex items-center justify-between gap-3">
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
          <nav aria-label="Halaman legal" className="flex rounded-full bg-card p-1">
            {PAGES.map((p) => (
              <Link
                key={p.key}
                href={p.href}
                aria-current={p.key === page ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-9 items-center rounded-full px-4 text-small font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  p.key === page
                    ? "bg-background text-foreground shadow-[0_1px_3px_rgb(22_20_29/0.1)]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
              </Link>
            ))}
          </nav>
        </header>

        <section className="flex items-center gap-5 @3xl:gap-12">
          <div className="flex min-w-0 flex-1 flex-col gap-3 @3xl:gap-4">
            <h1 className="font-display text-hero font-extrabold tracking-[-0.01em] @3xl:text-display-lg">{title}</h1>
            <p className="max-w-[46ch] text-body text-soft-foreground @3xl:text-title @3xl:leading-[1.45]">{lede}</p>
            <span className="text-meta text-muted-foreground">Diperbarui {updated}</span>
          </div>
          <div className="w-[92px] shrink-0 @3xl:w-[168px]">{art}</div>
        </section>

        <div className="@5xl:grid @5xl:grid-cols-[200px_minmax(0,1fr)] @5xl:gap-16">
          <LegalToc items={toc} />
          <div className="@container/content flex min-w-0 flex-col gap-10 @3xl:gap-12">{children}</div>
        </div>
      </main>
    </div>
  )
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-8 flex-col gap-3 @3xl:gap-4">
      <h2 className="font-display text-title font-bold tracking-[-0.01em] @3xl:text-display-sm">{title}</h2>
      {children}
    </section>
  )
}

export function LegalText({ children }: { children: React.ReactNode }) {
  return <p className="max-w-[62ch] text-body leading-[1.6] text-soft-foreground">{children}</p>
}
