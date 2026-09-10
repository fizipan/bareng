"use client"

import { supabase } from "@/lib/supabase/client"

export const PUBLIC_STUN: RTCIceServer[] = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }]

// Kredensial TURN berumur 2 jam; dipakai ulang selama 1 jam supaya sambung
// ulang tidak membuat kredensial baru terus.
const REUSE_MS = 60 * 60 * 1000
let cached: { servers: RTCIceServer[]; until: number } | null = null

export async function getIceServers(): Promise<RTCIceServer[]> {
  if (cached && cached.until > Date.now()) return cached.servers
  try {
    const { data } = await supabase().auth.getSession()
    const res = await fetch("/api/ice", {
      method: "POST",
      headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` },
    })
    if (!res.ok) return PUBLIC_STUN
    const body = (await res.json()) as { iceServers?: RTCIceServer[] }
    if (!body.iceServers?.length) return PUBLIC_STUN
    cached = { servers: body.iceServers, until: Date.now() + REUSE_MS }
    return body.iceServers
  } catch {
    return PUBLIC_STUN
  }
}
