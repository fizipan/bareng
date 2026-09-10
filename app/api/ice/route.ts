import { supabaseServer } from "@/lib/supabase/server"

// Server ICE untuk WebRTC. Dengan METERED_DOMAIN + METERED_SECRET_KEY, tiap
// permintaan dapat kredensial TURN berumur pendek (secret key tidak pernah ke
// klien); METERED_API_KEY saja = kredensial statis. Tanpa itu: STUN Google.

const STUN: RTCIceServer[] = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }]
const TTL_SECONDS = 2 * 60 * 60

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 })
  const { data, error } = await supabaseServer().auth.getClaims(token)
  if (error || !data) return Response.json({ error: "unauthorized" }, { status: 401 })

  let iceServers = STUN
  try {
    const turn = await meteredServers()
    if (turn.length) iceServers = turn
  } catch (e) {
    console.error("TURN Metered gagal, pakai STUN saja", e)
  }
  return Response.json({ iceServers }, { headers: { "Cache-Control": "no-store" } })
}

async function meteredServers(): Promise<RTCIceServer[]> {
  const domain = process.env.METERED_DOMAIN // mis. bareng.metered.live
  if (!domain) return []
  let apiKey = process.env.METERED_API_KEY
  const secret = process.env.METERED_SECRET_KEY
  if (secret) {
    const res = await fetch(`https://${domain}/api/v1/turn/credential?secretKey=${encodeURIComponent(secret)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiryInSeconds: TTL_SECONDS, label: "bareng" }),
      cache: "no-store",
    })
    if (!res.ok) throw new Error(`buat kredensial: ${res.status}`)
    apiKey = ((await res.json()) as { apiKey?: string }).apiKey
  }
  if (!apiKey) return []
  const res = await fetch(`https://${domain}/api/v1/turn/credentials?apiKey=${encodeURIComponent(apiKey)}`, {
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`ambil server ICE: ${res.status}`)
  return (await res.json()) as RTCIceServer[]
}
