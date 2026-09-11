import { after } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { emailFeedback } from "@/lib/admin/notify"
import { FEEDBACK_KINDS, FEEDBACK_MAX, FEEDBACK_MIN } from "@/lib/content/feedback"
import type { Database } from "@/lib/supabase/types"

// Info perangkat: datar & kecil. Kalau tidak sesuai, meta saja yang dibuang —
// kirimannya tetap masuk.
const metaSchema = z
  .record(z.string().max(40), z.union([z.string().max(160), z.number(), z.boolean()]))
  .refine((m) => Object.keys(m).length <= 30)

const body = z.object({
  kind: z.enum(FEEDBACK_KINDS.map((k) => k.id) as [string, ...string[]]),
  message: z.string().trim().min(FEEDBACK_MIN).max(FEEDBACK_MAX),
  email: z.union([z.literal(""), z.email().max(200)]).optional(),
  roomCode: z.union([z.literal(""), z.string().trim().toUpperCase().regex(/^[A-Z0-9]{6}$/)]).optional(),
  page: z.string().max(300).optional(),
  meta: z.unknown().optional(),
  // Jebakan bot (tersembunyi). Terisi → tetap disimpan sebagai "kemungkinan
  // spam" tanpa email, supaya kiriman asli yang kena autofill tidak hilang.
  trap: z.unknown().optional(),
  website: z.unknown().optional(),
})

// "Chrome 128 · Android 14 · SM-A546E" untuk email.
function summary(m: z.infer<typeof metaSchema> | undefined) {
  if (!m) return null
  const pair = (a: unknown, b: unknown) => [a, typeof b === "string" ? b.split(".")[0] : b].filter(Boolean).join(" ")
  return [pair(m.browser, m.browserVersion), [m.os, m.osVersion].filter(Boolean).join(" "), m.model ?? m.device, m.inApp && `dalam ${m.inApp}`]
    .filter(Boolean)
    .join(" · ") || null
}

// Kiriman Pusat bantuan. Sesi anonim (kalau ada) diteruskan untuk batas per
// orang; email ke admin dikirim setelah respons, maks ~20 per jam.
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 })
  const { kind, message, email, roomCode, page, meta, trap, website } = parsed.data
  const suspect = [trap, website].some((v) => typeof v === "string" ? v.trim() !== "" : v != null)
  const device = metaSchema.safeParse(meta)
  // Versi app (commit) dari Vercel, supaya bug bisa dicocokkan dengan deploy.
  const app = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)

  const auth = req.headers.get("authorization")
  const userAgent = req.headers.get("user-agent")?.slice(0, 400) ?? null
  const sb = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: auth?.startsWith("Bearer ") ? { headers: { Authorization: auth } } : undefined,
  })
  const { data, error } = await sb.rpc("submit_feedback", {
    p_kind: kind,
    p_message: message,
    p_email: email || undefined,
    p_room_code: roomCode || undefined,
    p_page: page || undefined,
    p_user_agent: userAgent ?? undefined,
    p_meta: { ...(device.success ? device.data : {}), ...(app ? { app } : {}) },
    p_suspect: suspect,
  })
  if (error) return Response.json({ error: "failed" }, { status: 500 })
  const result = data as { ok: boolean; reason?: string; last_hour?: number }
  if (!result.ok) return Response.json({ error: result.reason ?? "limit" }, { status: 429 })

  if (!suspect && (result.last_hour ?? 0) <= 20) {
    after(() =>
      emailFeedback({ kind, message, email: email || null, roomCode: roomCode || null, page: page || null, userAgent, device: summary(device.data) })
    )
  }
  return Response.json({ ok: true })
}
