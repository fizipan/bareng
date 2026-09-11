// Antarmuka gateway pembayaran (PRD R7). Sekarang hanya MockProvider;
// Midtrans/Xendit tinggal ditambah di lib/payments/index.ts + env
// PAYMENT_PROVIDER, tanpa mengubah alur maupun UI.
export type PaymentStatus = "paid" | "failed" | "expired"

export type ChargeInput = { orderId: string; amount: number; expiresAt: number; description: string }
// `qr` = isi QRIS yang dirender jadi kode QR di paywall.
export type Charge = { qr: string; providerRef: string }
export type WebhookEvent = { orderId: string; status: PaymentStatus; raw: Record<string, unknown> }

export interface PaymentProvider {
  readonly name: string
  // Mode uji: tidak ada uang sungguhan, paywall boleh menampilkan tombol simulasi.
  readonly test: boolean
  createCharge(input: ChargeInput): Promise<Charge>
  // null = tanda tangan atau isi notifikasi tidak sah.
  verifyWebhook(req: Request): Promise<WebhookEvent | null>
}
