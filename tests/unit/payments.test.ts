import { beforeAll, describe, expect, it } from "vitest"
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
