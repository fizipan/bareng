import { supabaseAdmin } from "@/lib/admin/supabase-admin"
import { paymentProvider } from "@/lib/payments"
import type { Json } from "@/lib/supabase/types"

// Notifikasi dari gateway. Satu-satunya jalan room jadi premium: tanda tangan
// diverifikasi provider, lalu payment_settle (idempoten) → broadcast ke dua HP.
// Balasan 5xx membuat gateway mengulang notifikasinya.
export async function POST(req: Request) {
  const provider = paymentProvider()
  const sb = supabaseAdmin()
  if (!provider || !sb) return Response.json({ error: "unavailable" }, { status: 503 })

  const event = await provider.verifyWebhook(req).catch(() => null)
  if (!event) return Response.json({ error: "invalid_signature" }, { status: 401 })
  // Kabar antara (mis. QR baru dibuat): sah, tapi belum mengubah apa pun.
  if (event.status === "pending") return Response.json({ ok: true, status: "pending" })

  const { data, error } = await sb.rpc("payment_settle", {
    p_order: event.orderId,
    p_status: event.status,
    p_raw: event.raw as Json,
  })
  if (error) return Response.json({ error: "failed" }, { status: 500 })
  const result = data as { ok: boolean; reason?: string; status?: string }
  if (!result.ok) return Response.json({ error: result.reason ?? "not_found" }, { status: 404 })
  return Response.json({ ok: true, status: result.status })
}
