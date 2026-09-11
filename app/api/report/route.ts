import { after } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { emailReport, NOTIFY_AT } from "@/lib/admin/notify"
import { REPORT_REASONS } from "@/lib/content/report-reasons"
import type { Database } from "@/lib/supabase/types"

const body = z.object({
  slug: z.string().regex(/^[A-Za-z0-9]{10}$/),
  reason: z.enum(REPORT_REASONS.map((r) => r.id) as [string, ...string[]]),
})

// Laporan dari halaman publik. Sesi anonim pelapor (kalau ada) diteruskan
// supaya satu orang tidak bisa melapor berulang; email ke admin dikirim
// setelah respons (tidak memperlambat pelapor).
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 })
  const { slug, reason } = parsed.data

  const auth = req.headers.get("authorization")
  const sb = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: auth?.startsWith("Bearer ") ? { headers: { Authorization: auth } } : undefined,
  })
  const { data, error } = await sb.rpc("file_report", { p_slug: slug, p_reason: reason })
  if (error) return Response.json({ error: "failed" }, { status: 500 })

  const result = data as { inserted: boolean; reports?: number }
  if (result.inserted && result.reports && NOTIFY_AT.has(result.reports)) {
    const reports = result.reports
    after(async () => {
      const { data: row } = await sb.rpc("get_public_result", { p_slug: slug })
      await emailReport({ slug, reason, reports, names: (row as { names?: string | null } | null)?.names ?? null })
    })
  }
  return Response.json({ ok: true })
}
