import Link from "next/link"
import { Logo, LogoMark } from "@/components/brand/logo"
import { StripIcon } from "@/components/brand/strip-icon"
import { FrameFill } from "@/components/strip/frame-fill"
import { Strip } from "@/components/strip/strip"
import { Button } from "@/components/ui/button"
import { SITE_HOST } from "@/lib/brand"
import { formatLongDate, formatStripDate } from "@/lib/format"
import type { Frame } from "@/lib/session/types"
import { getTemplate } from "@/lib/templates/builtin"
import { CopyPageLink, MemberDownload } from "./public-actions"
import { ReportButton } from "./report-button"

export type PublicResultData = {
  slug: string
  templateId: string
  filter?: string
  names: string | null
  createdAt: Date
  // File photostrip jadi; null selama HP masih mengunggahnya.
  imageUrl?: string | null
  // Pola contoh untuk galeri dev.
  frames?: Frame[]
}

const PENDING: Frame = { a: { kind: "pending" }, b: { kind: "pending" } }

// Halaman publik share (prototipe baris 843–889): strip, nama (opsional),
// tanggal, simpan, dan ajakan "Bikin punyamu". Tanpa lokasi — kami tidak
// mengumpulkannya. Layar lebar: strip di kiri, keterangan & aksi di kanan.
export function PublicResult({ data }: { data: PublicResultData }) {
  const template = getTemplate(data.templateId)
  const alt = data.names ? `Photostrip ${data.names}` : "Photostrip Bareng"

  return (
    <main className="@container flex w-full flex-1 flex-col">
      <div className="mx-auto grid w-full max-w-[440px] gap-6 px-5 pt-3 pb-8 @3xl:max-w-[960px] @3xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)] @3xl:items-center @3xl:gap-x-14 @3xl:gap-y-10 @3xl:px-10 @3xl:pt-6 @3xl:pb-14">
        <header className="flex items-center justify-between gap-3 @3xl:col-span-2">
          <Link href="/" aria-label="Beranda" className="rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <Logo size={28} wordmarkClassName="text-[19px]" />
          </Link>
          <CopyPageLink />
        </header>

        <div className="group relative flex items-center justify-center overflow-hidden rounded-md bg-card px-5 py-9 @3xl:py-12">
          <span aria-hidden className="absolute inset-0 bg-dots [mask-image:radial-gradient(circle_at_center,#000_30%,transparent_80%)]" />
          {data.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.imageUrl}
              alt={alt}
              width={template.canvas.width}
              height={template.canvas.height}
              fetchPriority="high"
              draggable={false}
              // Tanpa "Simpan gambar" lewat klik kanan / tekan lama: unduh cuma untuk
              // kalian berdua lewat tombol di bawah.
              className="pointer-events-none relative h-auto w-[200px] -rotate-2 shadow-strip transition-transform duration-300 ease-out select-none [-webkit-touch-callout:none] group-hover:rotate-0 @3xl:w-[240px]"
            />
          ) : (
            <div className="relative flex flex-col items-center gap-3">
              <Strip
                template={template}
                tokens={{ date: formatStripDate(data.createdAt), host: SITE_HOST, names: data.names }}
                filter={data.filter}
                shadow="strip"
                className="w-[200px] -rotate-2 @3xl:w-[240px]"
                renderHalf={(i, side) => <FrameFill source={(data.frames?.[i] ?? PENDING)[side]} side={side} />}
              />
              {!data.frames && (
                <span className="text-caption text-muted-foreground">Photostrip lagi disiapkan, muat ulang sebentar lagi.</span>
              )}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col items-center gap-5 text-center @3xl:items-start @3xl:gap-6 @3xl:text-left">
          <div className="flex flex-col items-center gap-2.5 @3xl:items-start">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-caption font-medium text-soft-foreground">
              <span aria-hidden className="size-1.5 rounded-full bg-ok" />
              Difoto serentak dari dua HP
            </span>
            <h1 className="font-display text-display-md font-bold tracking-[-0.01em] @3xl:text-display-lg">
              {data.names ?? "Photostrip berdua"}
            </h1>
            <span className="text-body text-muted-foreground">{formatLongDate(data.createdAt)}</span>
          </div>

          {data.imageUrl && <MemberDownload imageUrl={data.imageUrl} slug={data.slug} />}

          <div className="flex w-full flex-col gap-4 rounded-md bg-darkroom p-5 text-left text-kertas @3xl:p-6">
            <span className="flex items-center gap-3">
              <LogoMark size={30} />
              <span className="font-display text-title font-bold">Mau foto bareng juga?</span>
            </span>
            <p className="text-small text-kabin-soft">
              Kirim satu link ke dia, hitung mundur bareng, dan photostrip kalian jadi dalam 90 detik. Gratis, tanpa
              daftar.
            </p>
            <Button render={<Link href="/" />} nativeButton={false}>
              <StripIcon data-icon="inline-start" />
              Bikin punyamu
            </Button>
          </div>
        </div>
      </div>

      <footer className="mt-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-5 pb-8 text-meta text-muted-foreground">
        <ReportButton slug={data.slug} />
        <span aria-hidden>·</span>
        <Link href="/privasi" className="inline-flex min-h-11 items-center underline-offset-4 hover:text-foreground hover:underline">
          Privasi
        </Link>
        <span aria-hidden>·</span>
        <Link href="/ketentuan" className="inline-flex min-h-11 items-center underline-offset-4 hover:text-foreground hover:underline">
          Ketentuan
        </Link>
      </footer>
    </main>
  )
}
