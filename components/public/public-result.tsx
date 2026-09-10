import Link from "next/link"
import { Logo } from "@/components/brand/logo"
import { StripIcon } from "@/components/brand/strip-icon"
import { FrameFill } from "@/components/strip/frame-fill"
import { Strip } from "@/components/strip/strip"
import { Button } from "@/components/ui/button"
import { SITE_HOST } from "@/lib/brand"
import { formatLongDate, formatStripDate } from "@/lib/format"
import type { Frame } from "@/lib/session/types"
import { getTemplate } from "@/lib/templates/builtin"
import { ReportButton } from "./report-button"

export type PublicResultData = {
  slug: string
  templateId: string
  filter?: string
  names: string | null
  createdAt: Date
  frames: Frame[]
}

// Halaman publik share (prototipe baris 843–889): strip, nama (opsional),
// tanggal, CTA "Bikin punyamu". Tanpa lokasi — kami tidak mengumpulkannya.
export function PublicResult({ data }: { data: PublicResultData }) {
  const template = getTemplate(data.templateId)
  return (
    <main className="@container mx-auto flex w-full max-w-[440px] flex-col items-center gap-[22px] px-5 pt-3 pb-9 text-center">
      <div className="flex w-full items-center justify-between">
        <Link href="/" aria-label="Beranda" className="rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Logo size={28} wordmarkClassName="text-[19px]" />
        </Link>
        <span className="font-mono text-caption text-muted-foreground">
          {SITE_HOST}/p/{data.slug}
        </span>
      </div>

      <Strip
        template={template}
        tokens={{ date: formatStripDate(data.createdAt), host: SITE_HOST }}
        filter={data.filter}
        shadow="strip"
        className="w-[192px] @sm:w-[220px]"
        renderHalf={(i, side) => <FrameFill source={data.frames[i][side]} side={side} />}
      />

      <div className="flex flex-col gap-1">
        {data.names && <h1 className="font-display text-title font-semibold">{data.names}</h1>}
        <span className="text-meta text-muted-foreground">{formatLongDate(data.createdAt)}</span>
      </div>

      <Button className="w-full" render={<Link href="/" />} nativeButton={false}>
        <StripIcon data-icon="inline-start" />
        Bikin punyamu
      </Button>
      <ReportButton slug={data.slug} />
    </main>
  )
}
