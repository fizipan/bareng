"use client"

import { supabase } from "@/lib/supabase/client"

// Foto per peserta di bucket privat `frames`. Versi shot ada di nama file,
// jadi foto ulang tidak pernah menimpa file lama.
export const framePath = (roomId: string, participantId: string, idx: number, version: number) =>
  `${roomId}/${participantId}/${idx}-${version}.jpg`

export async function uploadFrame(path: string, blob: Blob) {
  const { error } = await supabase()
    .storage.from("frames")
    .upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false })
  // Percobaan sebelumnya ternyata sudah sampai.
  if (error && !/exist|duplicate/i.test(error.message)) throw error
}

// URL sementara untuk foto pasangan (dan foto sendiri setelah muat ulang).
export async function signFrames(paths: string[]): Promise<Record<string, string>> {
  const { data, error } = await supabase().storage.from("frames").createSignedUrls(paths, 60 * 60)
  if (error) throw error
  const urls: Record<string, string> = {}
  for (const item of data) if (item.path && item.signedUrl) urls[item.path] = item.signedUrl
  return urls
}

// Coba lagi dengan jeda makin panjang (sinyal HP naik-turun).
export async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let delay = 500
  for (let i = 1; ; i++) {
    try {
      return await fn()
    } catch (e) {
      if (i >= attempts) throw e
      await new Promise((r) => setTimeout(r, delay))
      delay *= 2
    }
  }
}
