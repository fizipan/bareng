import { after } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { emailDemoRequest } from "@/lib/admin/notify"
import type { Database, Json } from "@/lib/supabase/types"

const metaSchema = z
  .record(z.string().max(40), z.union([z.string().max(160), z.number(), z.boolean()]))
  .refine((m) => Object.keys(m).length <= 30)

const body = z.object({
  name: z.string().trim().min(2).max(60),
  contact: z.string().trim().max(80).optional(),
  note: z.string().trim().max(300).optional(),
  meta: z.unknown().optional(),
})

// Permintaan akses demo dari halaman /demo. Sesi anonim wajib (itu yang nanti
// disetujui admin sebagai "perangkat demo"); email ke admin setelah respons.
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 })
  const { name, contact, note, meta } = parsed.data
  const device = metaSchema.safeParse(meta)

  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return Response.json({ error: "unauthorized" }, { status: 401 })
  const sb = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: auth } },
  })
  const { data, error } = await sb.rpc("request_demo", {
    p_name: name,
    p_contact: contact || undefined,
    p_note: note || undefined,
    p_meta: (device.success ? device.data : {}) as Json,
  })
  if (error) return Response.json({ error: "failed" }, { status: 500 })
  const result = data as { ok: boolean; status?: string; reason?: string }
  if (!result.ok) return Response.json({ error: result.reason ?? "limit" }, { status: 429 })

  if (result.status === "pending") {
    const d = device.success ? device.data : {}
    const summary = [d.model ?? d.browser, d.os].filter(Boolean).join(" · ")
    after(() => emailDemoRequest({ name, contact: contact || null, note: note || null, device: summary || null }))
  }
  return Response.json({ ok: true, status: result.status ?? "pending" })
}
