"use client"

import { supabase } from "@/lib/supabase/client"

// Photostrip jadi di bucket publik `results`. Nama file = pengaturan hasil
// (template, filter, gratis/premium), jadi dua HP yang merender bersamaan
// menulis path yang sama dan render lama tidak pernah tertukar.
export const resultKey = (templateId: string, filterId: string, premium: boolean) =>
  `${templateId}-${filterId}-${premium ? "premium" : "free"}`

export const resultPath = (roomId: string, slug: string, key: string) => `${roomId}/${slug}/${key}.jpg`

export { cardPathOf } from "@/lib/results-url"

// Cache CDN pendek: kalau hasil dihapus, salinan di CDN ikut hilang cepat.
export async function uploadResult(path: string, blob: Blob) {
  const { error } = await supabase()
    .storage.from("results")
    .upload(path, blob, { contentType: "image/jpeg", cacheControl: "300", upsert: false })
  // HP lain sudah mengunggah render yang sama.
  if (error && !/exist|duplicate/i.test(error.message)) throw error
}

export async function loadBitmap(url: string): Promise<ImageBitmap> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`image_${res.status}`)
  return createImageBitmap(await res.blob())
}
