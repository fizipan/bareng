import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PublicResult } from "@/components/public/public-result"
import { DEMO_RESULT } from "@/lib/session/demo"

// M1: hanya slug contoh. M5 mengambil hasil asli dari Supabase + OG image.
export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params
  if (slug !== DEMO_RESULT.slug) return {}
  return {
    title: `Photostrip ${DEMO_RESULT.names}`,
    description: "Foto bareng walau jauh. Bikin punyamu, gratis dan tanpa daftar.",
    robots: { index: false },
  }
}

export default async function PublicResultPage({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params
  if (slug !== DEMO_RESULT.slug) notFound()
  return <PublicResult data={DEMO_RESULT} />
}
