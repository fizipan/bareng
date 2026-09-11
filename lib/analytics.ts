"use client"

import { supabase } from "@/lib/supabase/client"

// Catatan teknis (M7) ke tabel `events` lewat RPC `track`: tanpa pihak ketiga
// dan tanpa data pribadi. Hanya tercatat untuk peserta room; kalau gagal,
// diam saja (tidak pernah mengganggu sesi).
export type TrackName =
  | "camera_granted"
  | "camera_denied"
  | "rtc_connected"
  | "rtc_failed"
  | "result_viewed"
  | "download"
  | "share"
  | "paywall_viewed"
  | "retake"
  | "mic_result"

const sent = new Set<string>()

export function track(
  roomId: string | null,
  name: TrackName,
  props?: Record<string, string | number | boolean>,
  { once = false }: { once?: boolean } = {}
) {
  if (!roomId || typeof window === "undefined") return
  if (once) {
    const key = `${roomId}:${name}`
    if (sent.has(key)) return
    sent.add(key)
  }
  supabase()
    .rpc("track", { p_room: roomId, p_name: name, p_props: props })
    .then(
      () => {},
      () => {}
    )
}
