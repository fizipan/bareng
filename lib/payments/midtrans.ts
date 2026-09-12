import { createHash, timingSafeEqual } from "node:crypto"
import { z } from "zod"
import type { PaymentProvider, PaymentStatus } from "./provider"

// Midtrans Core API, khusus QRIS. Untuk tiket sekecil Rp15.000 hanya QRIS yang
// masuk akal: biayanya 0,7% (sudah termasuk PPN), sedangkan virtual account
// Rp4.000 flat dan kartu 2,9% + Rp2.000 — jangan aktifkan keduanya di sini.
//
// Sandbox atau produksi ditentukan dari kunci servernya sendiri (kunci sandbox
// berawalan "SB-"), jadi cukup satu env: MIDTRANS_SERVER_KEY. Kunci itu rahasia
// dan hanya hidup di server.
const HOST = { sandbox: "https://api.sandbox.midtrans.com", live: "https://api.midtrans.com" }
const TIMEOUT_MS = 10_000

const charged = z.object({
  status_code: z.string(),
  transaction_id: z.string(),
  actions: z.array(z.object({ name: z.string(), url: z.url() })).default([]),
})

const notification = z.object({
  order_id: z.string(),
  status_code: z.string(),
  gross_amount: z.string(),
  signature_key: z.string(),
  transaction_status: z.string(),
  fraud_status: z.string().optional(),
})

// Peta status Midtrans → keputusan kita. Selain yang di bawah (termasuk
// "pending" dan refund) tidak mengubah apa pun.
function outcome(n: z.infer<typeof notification>): PaymentStatus | "pending" {
  switch (n.transaction_status) {
    case "settlement":
      return "paid"
    // Hanya kartu; "challenge" masih menunggu keputusan manual.
    case "capture":
      return n.fraud_status === "challenge" ? "pending" : "paid"
    case "expire":
      return "expired"
    case "deny":
    case "cancel":
    case "failure":
      return "failed"
    default:
      return "pending"
  }
}

// Nama barang di struk Midtrans: ASCII, maksimal 50 karakter.
const itemName = (s: string) => s.replace(/[^\x20-\x7E]/g, "-").slice(0, 50)

export function midtransProvider(): PaymentProvider | null {
  const key = process.env.MIDTRANS_SERVER_KEY
  if (!key) return null
  const sandbox = key.startsWith("SB-")
  const host = sandbox ? HOST.sandbox : HOST.live
  const auth = `Basic ${Buffer.from(`${key}:`).toString("base64")}`

  return {
    name: "midtrans",
    test: sandbox,
    simulatable: false,

    async createCharge({ orderId, amount, description }) {
      const res = await fetch(`${host}/v2/charge`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json", authorization: auth },
        body: JSON.stringify({
          payment_type: "qris",
          qris: { acquirer: "gopay" },
          transaction_details: { order_id: orderId, gross_amount: amount },
          item_details: [{ id: "premium", name: itemName(description), price: amount, quantity: 1 }],
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      const body = charged.safeParse(await res.json().catch(() => null))
      // 201 = tagihan dibuat. Selain itu anggap gagal; route yang membatalkan.
      if (!res.ok || !body.success || body.data.status_code !== "201") throw new Error("midtrans_charge_failed")

      // Midtrans membalas URL gambar QR, bukan isi QRIS-nya. Yang tanpa bingkai
      // dulu, supaya rapi di kartu kita; v2 (berbingkai ASPI) sebagai cadangan.
      const url =
        body.data.actions.find((a) => a.name === "generate-qr-code")?.url ??
        body.data.actions.find((a) => a.name === "generate-qr-code-v2")?.url
      if (!url) throw new Error("midtrans_qr_missing")
      return { qr: url, providerRef: body.data.transaction_id }
    },

    async verifyWebhook(req) {
      const json: unknown = await req.json().catch(() => null)
      const parsed = notification.safeParse(json)
      if (!parsed.success) return null
      const n = parsed.data
      const want = createHash("sha512").update(`${n.order_id}${n.status_code}${n.gross_amount}${key}`).digest("hex")
      const got = n.signature_key.toLowerCase()
      if (got.length !== want.length || !timingSafeEqual(Buffer.from(got), Buffer.from(want))) return null
      return { orderId: n.order_id, status: outcome(n), raw: json as Record<string, unknown> }
    },
  }
}
