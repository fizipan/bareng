import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PublicResult } from "@/components/public/public-result"
import { getPublicResult } from "@/lib/public-result"
import { publicResultUrl } from "@/lib/results-url"

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const row = await getPublicResult((await params).slug)
  if (!row) return { title: "Photostrip tidak ditemukan", robots: { index: false } }
  const title = row.names ? `Photostrip ${row.names}` : "Photostrip Bareng"
  const description = "Foto bareng walau jauh. Bikin punyamu, gratis dan tanpa daftar."
  return {
    title,
    description,
    robots: { index: false },
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function PublicResultPage({ params }: PageProps<"/p/[slug]">) {
  const row = await getPublicResult((await params).slug)
  if (!row) notFound()
  return (
    <PublicResult
      data={{
        slug: row.slug,
        templateId: row.template_id,
        names: row.names,
        createdAt: new Date(row.created_at),
        expiresAt: row.expires_at,
        imageUrl: row.image_path ? publicResultUrl(row.image_path) : null,
      }}
    />
  )
}
