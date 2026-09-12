import { createHash } from "node:crypto"
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { midtransProvider } from "@/lib/payments/midtrans"
import { mockProvider, mockWebhookRequest, signMock } from "@/lib/payments/mock"

const URL = "https://bareng.test/api/payments/webhook"
const ORDER = "BRG-ABCDEFGH2345"

beforeAll(() => {
  process.env.PAYMENT_MOCK_SECRET = "rahasia-uji"
})

describe("MockProvider", () => {
  it("tagihan berisi QR uji dengan nomor order & jumlah", async () => {
    const charge = await mockProvider.createCharge({ orderId: ORDER, amount: 15000, expiresAt: 0, description: "x" })
    expect(charge.qr).toBe(`BARENG-UJI|${ORDER}|15000`)
    expect(mockProvider.test).toBe(true)
  })

  it("menerima notifikasi bertanda tangan sah", async () => {
    const event = await mockProvider.verifyWebhook(mockWebhookRequest(URL, ORDER, "paid", 1))
    expect(event).toEqual({ orderId: ORDER, status: "paid", raw: { order_id: ORDER, status: "paid", at: 1 } })
  })

  it("menolak isi yang diubah setelah ditandatangani", async () => {
    const signed = mockWebhookRequest(URL, ORDER, "failed", 1)
    const sig = signed.headers.get("x-bareng-signature")!
    const tampered = new Request(URL, {
      method: "POST",
      headers: { "x-bareng-signature": sig },
      body: JSON.stringify({ order_id: ORDER, status: "paid", at: 1 }),
    })
    expect(await mockProvider.verifyWebhook(tampered)).toBeNull()
  })

  it("menolak tanpa tanda tangan, tanda tangan salah, atau isi tidak dikenal", async () => {
    const body = JSON.stringify({ order_id: ORDER, status: "paid", at: 1 })
    expect(await mockProvider.verifyWebhook(new Request(URL, { method: "POST", body }))).toBeNull()
    expect(
      await mockProvider.verifyWebhook(new Request(URL, { method: "POST", headers: { "x-bareng-signature": "00" }, body }))
    ).toBeNull()
    const odd = JSON.stringify({ order_id: "bukan-order", status: "paid", at: 1 })
    expect(
      await mockProvider.verifyWebhook(new Request(URL, { method: "POST", headers: { "x-bareng-signature": signMock(odd) }, body: odd }))
    ).toBeNull()
  })
})

const KEY = "SB-Mid-server-rahasia"
const QR = "https://api.sandbox.midtrans.com/v2/qris/abc/qr-code"

// Notifikasi Midtrans: tanda tangannya sha512(order+status_code+jumlah+kunci).
function midtransNotification(fields: Record<string, string>) {
  const body = {
    order_id: ORDER,
    status_code: "200",
    gross_amount: "15000.00",
    transaction_status: "settlement",
    ...fields,
  }
  const signature_key = createHash("sha512")
    .update(`${body.order_id}${body.status_code}${body.gross_amount}${KEY}`)
    .digest("hex")
  return new Request(URL, { method: "POST", body: JSON.stringify({ ...body, signature_key }) })
}

function midtrans() {
  process.env.MIDTRANS_SERVER_KEY = KEY
  return midtransProvider()!
}

describe("MidtransProvider", () => {
  afterEach(() => {
    delete process.env.MIDTRANS_SERVER_KEY
  })

  it("tidak aktif tanpa kunci server", () => {
    delete process.env.MIDTRANS_SERVER_KEY
    expect(midtransProvider()).toBeNull()
  })

  it("kunci SB- berarti sandbox: mode uji, tanpa tombol simulasi", () => {
    expect(midtrans()).toMatchObject({ name: "midtrans", test: true, simulatable: false })
    process.env.MIDTRANS_SERVER_KEY = "Mid-server-sungguhan"
    expect(midtransProvider()).toMatchObject({ test: false, simulatable: false })
  })

  it("membuat tagihan QRIS dan memakai URL gambar QR dari gateway", async () => {
    let sent: { url: string; body: Record<string, unknown> } | null = null
    const provider = midtrans()
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      sent = { url: String(url), body: JSON.parse(String(init.body)) }
      return Response.json({
        status_code: "201",
        transaction_id: "trx-1",
        actions: [
          { name: "generate-qr-code", method: "GET", url: QR },
          { name: "generate-qr-code-v2", method: "GET", url: `${QR}-v2` },
        ],
      })
    }) as typeof fetch

    const charge = await provider.createCharge({ orderId: ORDER, amount: 15000, expiresAt: 0, description: "Bareng · premium" })
    expect(charge).toEqual({ qr: QR, providerRef: "trx-1" })
    expect(sent!.url).toBe("https://api.sandbox.midtrans.com/v2/charge")
    expect(sent!.body).toMatchObject({
      payment_type: "qris",
      transaction_details: { order_id: ORDER, gross_amount: 15000 },
    })
  })

  it("gagal kalau gateway tidak membalas 201", async () => {
    const provider = midtrans()
    globalThis.fetch = (async () => Response.json({ status_code: "406" }, { status: 406 })) as typeof fetch
    await expect(provider.createCharge({ orderId: ORDER, amount: 15000, expiresAt: 0, description: "x" })).rejects.toThrow()
  })

  it("menerima notifikasi bertanda tangan sah", async () => {
    const event = await midtrans().verifyWebhook(midtransNotification({}))
    expect(event).toMatchObject({ orderId: ORDER, status: "paid" })
  })

  it("menolak tanda tangan yang tidak cocok", async () => {
    const palsu = new Request(URL, {
      method: "POST",
      body: JSON.stringify({
        order_id: ORDER,
        status_code: "200",
        gross_amount: "15000.00",
        transaction_status: "settlement",
        signature_key: "00",
      }),
    })
    expect(await midtrans().verifyWebhook(palsu)).toBeNull()
    expect(await midtrans().verifyWebhook(new Request(URL, { method: "POST", body: "bukan json" }))).toBeNull()
  })

  it("memetakan status Midtrans ke keputusan kita", async () => {
    const provider = midtrans()
    const status = async (fields: Record<string, string>) => (await provider.verifyWebhook(midtransNotification(fields)))?.status
    expect(await status({ transaction_status: "expire" })).toBe("expired")
    expect(await status({ transaction_status: "deny" })).toBe("failed")
    expect(await status({ transaction_status: "cancel" })).toBe("failed")
    // Belum keputusan akhir: room tidak disentuh.
    expect(await status({ transaction_status: "pending" })).toBe("pending")
    expect(await status({ transaction_status: "capture", fraud_status: "challenge" })).toBe("pending")
    expect(await status({ transaction_status: "capture", fraud_status: "accept" })).toBe("paid")
  })
})
