import { cache } from "react"
import { supabaseServer } from "@/lib/supabase/server"

export type PublicRow = {
  slug: string
  template_id: string
  filter_id: string
  names: string | null
  watermark: boolean
  image_path: string | null
  created_at: number
  // null = tersimpan selamanya (sesi premium).
  expires_at: number | null
}

// Satu kali per request untuk halaman, metadata, dan gambar pratinjau.
export const getPublicResult = cache(async (slug: string): Promise<PublicRow | null> => {
  if (!/^[A-Za-z0-9]{10}$/.test(slug)) return null
  const { data } = await supabaseServer().rpc("get_public_result", { p_slug: slug })
  return (data as PublicRow | null) ?? null
})
