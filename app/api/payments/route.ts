import { z } from "zod"
import { supabaseAdmin } from "@/lib/admin/supabase-admin"
import { PREMIUM_PRICE } from "@/lib/content/pricing"
import { paymentProvider } from "@/lib/payments"

// Dari dalam sesi: roomId. Dari halaman publik (simpan selamanya): slug.
const body = z.union([
  z.object({ roomId: z.uuid(), templateId: z.string().max(40).nullish() }),
  z.object({ slug: z.string().regex(/^[A-Za-z0-9]{10}$/) }),
])

const STATUS: Record<string, number> = {
  not_participant: 403,
  room_expired: 410,
  already_premium: 409,
  template_not_found: 400,
  rate_limited: 429,
}

// Buka tagihan QRIS premium untuk room ini. Hanya peserta room (token sesi
// anonim diverifikasi), harga dari server. Tagihan yang masih berlaku dipakai
// lagi, jadi dua orang yang membuka paywall melihat QR yang sama.
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 })
  const provider = paymentProvider()
  const sb = supabaseAdmin()
  if (!provider || !sb) return Response.json({ error: "unavailable" }, { status: 503 })

  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1]
  const { data: auth } = token ? await sb.auth.getUser(token) : { data: { user: null } }
  if (!auth.user) return Response.json({ error: "unauthorized" }, { status: 401 })

  let roomId: string
  let templateId: string | null = null
  if ("slug" in parsed.data) {
    // Photostrip yang masih hidup → room-nya; keanggotaan dicek payment_open.
    const { data: row } = await sb
      .from("results")
      .select("room_id")
      .eq("slug", parsed.data.slug)
      .is("deleted_at", null)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .maybeSingle()
    if (!row) return Response.json({ error: "not_found" }, { status: 404 })
    roomId = row.room_id
  } else {
    roomId = parsed.data.roomId
    templateId = parsed.data.templateId ?? null
  }

  const { data, error } = await sb.rpc("payment_open", {
    p_user: auth.user.id,
    p_room: roomId,
    p_template: templateId,
    p_provider: provider.name,
    p_amount: PREMIUM_PRICE,
  })
  if (error) {
    const code = error.message.match(/^[a-z_]+$/)?.[0] ?? "failed"
    return Response.json({ error: code }, { status: STATUS[code] ?? 500 })
  }

  const charge = data as { order_id: string; amount: number; qr: string | null; expires_at: number }
  let qr = charge.qr
  if (!qr) {
    try {
      const made = await provider.createCharge({
        orderId: charge.order_id,
        amount: charge.amount,
        expiresAt: charge.expires_at,
        description: "Bareng · sesi premium",
      })
      await sb.rpc("payment_attach", { p_order: charge.order_id, p_provider_ref: made.providerRef, p_qr: made.qr })
      qr = made.qr
    } catch {
      await sb.rpc("payment_settle", { p_order: charge.order_id, p_status: "failed" })
      return Response.json({ error: "provider" }, { status: 502 })
    }
  }

  return Response.json({
    orderId: charge.order_id,
    amount: charge.amount,
    qr,
    expiresAt: charge.expires_at,
    test: provider.test,
    simulate: provider.simulatable,
  })
}
