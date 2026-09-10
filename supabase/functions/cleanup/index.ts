import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

// Membuang file hasil yang dihapus/kedaluwarsa (gratis 7 hari) dan foto
// mentah room yang tidak dipakai lagi. Dua pemanggil:
// - pg_cron tiap jam, header `x-cleanup-token` (token hanya ada di DB);
// - klien setelah "Hapus foto ini", JWT user + { slug } → hanya slug itu.
// Yang dibuang hanya data yang di database memang sudah mati, jadi aman
// dipanggil berulang.

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } })

type Target = { kind: "result" | "room"; id: string; bucket: string; name: string | null }

async function authorized(req: Request, slug: string | null) {
  const token = req.headers.get("x-cleanup-token")
  if (token) {
    const { data } = await sb.rpc("cleanup_token_ok", { p_token: token })
    return data === true
  }
  const jwt = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!slug || !jwt) return false
  const { data } = await sb.auth.getUser(jwt)
  return !!data.user
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405)

  const body = await req.json().catch(() => ({}))
  const slug = typeof body?.slug === "string" && /^[A-Za-z0-9]{10}$/.test(body.slug) ? body.slug : null
  if (!(await authorized(req, slug))) return json({ error: "unauthorized" }, 401)

  const { data, error } = await sb.rpc("cleanup_targets", { p_slug: slug })
  if (error) return json({ error: error.message }, 500)
  const targets = (data ?? []) as Target[]

  const byBucket = new Map<string, string[]>()
  for (const t of targets) {
    if (t.name) byBucket.set(t.bucket, [...(byBucket.get(t.bucket) ?? []), t.name])
  }
  let removed = 0
  for (const [bucket, names] of byBucket) {
    for (let i = 0; i < names.length; i += 100) {
      const { error: removeError } = await sb.storage.from(bucket).remove(names.slice(i, i + 100))
      if (removeError) return json({ error: removeError.message, removed }, 500)
      removed += Math.min(100, names.length - i)
    }
  }

  const results = [...new Set(targets.filter((t) => t.kind === "result").map((t) => t.id))]
  const rooms = [...new Set(targets.filter((t) => t.kind === "room").map((t) => t.id))]
  if (results.length || rooms.length) {
    const { error: markError } = await sb.rpc("cleanup_mark", { p_results: results, p_rooms: rooms })
    if (markError) return json({ error: markError.message, removed }, 500)
  }
  return json({ removed, results: results.length, rooms: rooms.length })
})
