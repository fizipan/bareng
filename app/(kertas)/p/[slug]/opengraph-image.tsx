import { SITE_URL } from "@/lib/brand"
import { getPublicResult } from "@/lib/public-result"
import { cardPathOf, publicResultUrl } from "@/lib/results-url"

// Pratinjau link per hasil: kartu JPEG 1200×630 yang dirender HP saat
// photostrip jadi (lib/templates/share-card.ts). Belum ada → kartu umum situs.
export const alt = "Photostrip Bareng"
export const size = { width: 1200, height: 630 }
export const contentType = "image/jpeg"
export const dynamic = "force-dynamic"

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const row = await getPublicResult((await params).slug)
  if (row?.image_path) {
    const res = await fetch(publicResultUrl(cardPathOf(row.image_path)), { cache: "no-store" })
    if (res.ok && res.body) {
      return new Response(res.body, {
        headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=300, s-maxage=3600" },
      })
    }
  }
  return Response.redirect(new URL("/opengraph-image", SITE_URL), 302)
}
