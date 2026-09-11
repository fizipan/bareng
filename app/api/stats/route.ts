import { supabaseServer } from "@/lib/supabase/server"

export type LandingStats = {
  peopleLive: number
  stripsToday: number
  stripsTotal: number
  lastStripAt: number | null
}

// Angka hidup untuk landing. Di-cache CDN 15 detik, jadi seramai apa pun
// landing dibuka, database cukup ditanya sekali per 15 detik.
export async function GET() {
  const { data, error } = await supabaseServer().rpc("landing_stats")
  if (error || !data) {
    return Response.json({ error: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } })
  }
  const row = data as { people_live: number; strips_today: number; strips_total: number; last_strip_at: number | null }
  const stats: LandingStats = {
    peopleLive: row.people_live,
    stripsToday: row.strips_today,
    stripsTotal: row.strips_total,
    lastStripAt: row.last_strip_at === null ? null : Math.round(row.last_strip_at),
  }
  return Response.json(stats, { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45" } })
}
