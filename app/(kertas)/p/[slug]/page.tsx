import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { PublicResult } from "@/components/public/public-result"
import { placeholderFrame } from "@/lib/session/demo"
import { supabaseServer } from "@/lib/supabase/server"

type PublicRow = { slug: string; template_id: string; filter_id: string; names: string | null; created_at: number }

const getResult = cache(async (slug: string) => {
  const { data } = await supabaseServer().rpc("get_public_result", { p_slug: slug })
  return (data as PublicRow | null) ?? null
})

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const row = await getResult((await params).slug)
  if (!row) return { title: "Photostrip tidak ditemukan", robots: { index: false } }
  return {
    title: row.names ? `Photostrip ${row.names}` : "Photostrip Bareng",
    description: "Foto bareng walau jauh. Bikin punyamu, gratis dan tanpa daftar.",
    robots: { index: false },
  }
}

export default async function PublicResultPage({ params }: PageProps<"/p/[slug]">) {
  const row = await getResult((await params).slug)
  if (!row) notFound()
  // M5: frame asli dari Storage. Sementara pola placeholder.
  return (
    <PublicResult
      data={{
        slug: row.slug,
        templateId: row.template_id,
        names: row.names,
        createdAt: new Date(row.created_at),
        frames: [0, 1, 2, 3].map(placeholderFrame),
      }}
    />
  )
}
