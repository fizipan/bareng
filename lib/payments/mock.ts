import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import { z } from "zod"
import type { PaymentProvider, PaymentStatus } from "./provider"

const HEADER = "x-bareng-signature"

const event = z.object({
  order_id: z.string().regex(/^BRG-[A-Z0-9]{12}$/),
  status: z.enum(["paid", "failed", "expired"]),
  at: z.number(),
})

// Kunci tanda tangan notifikasi uji: PAYMENT_MOCK_SECRET, atau diturunkan dari
// kunci server yang sudah ada supaya tidak perlu env tambahan.
function secret() {
  const base = process.env.PAYMENT_MOCK_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base) throw new Error("payment_secret_missing")
  return createHash("sha256").update(`bareng-mock-payment:${base}`).digest()
}

export const signMock = (body: string) => createHmac("sha256", secret()).update(body).digest("hex")

// Notifikasi seperti yang dikirim gateway sungguhan ke /api/payments/webhook.
export function mockWebhookRequest(url: string, orderId: string, status: PaymentStatus, at = Date.now()) {
  const body = JSON.stringify({ order_id: orderId, status, at })
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", [HEADER]: signMock(body) },
    body,
  })
}

// Gateway pura-pura: QR berisi teks uji (tidak bisa dibayar sungguhan), lunas
// atau gagal lewat tombol simulasi di paywall.
export const mockProvider: PaymentProvider = {
  name: "mock",
  test: true,
  async createCharge({ orderId, amount }) {
    return { qr: `BARENG-UJI|${orderId}|${amount}`, providerRef: `mock_${orderId}` }
  },
  async verifyWebhook(req) {
    const body = await req.text()
    const got = Buffer.from(req.headers.get(HEADER) ?? "")
    const want = Buffer.from(signMock(body))
    if (got.length !== want.length || !timingSafeEqual(got, want)) return null
    let json: unknown
    try {
      json = JSON.parse(body)
    } catch {
      return null
    }
    const parsed = event.safeParse(json)
    if (!parsed.success) return null
    return { orderId: parsed.data.order_id, status: parsed.data.status, raw: parsed.data }
  },
}
