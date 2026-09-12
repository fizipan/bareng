// Antarmuka gateway pembayaran (PRD R7): mock untuk pengembangan, Midtrans
// untuk uang sungguhan. Gateway lain tinggal ditambah di lib/payments/index.ts
// + env PAYMENT_PROVIDER, tanpa mengubah alur maupun UI.
export type PaymentStatus = "paid" | "failed" | "expired"

export type ChargeInput = { orderId: string; amount: number; expiresAt: number; description: string }
// `qr` = isi QRIS yang dirender jadi kode QR di paywall, atau URL gambar QR
// kalau gateway-nya memang membalas gambar (Midtrans begitu).
export type Charge = { qr: string; providerRef: string }
// "pending" = notifikasinya sah tapi belum keputusan akhir (gateway mengirim
// kabar tiap perubahan status); room tidak disentuh.
export type WebhookEvent = { orderId: string; status: PaymentStatus | "pending"; raw: Record<string, unknown> }

export interface PaymentProvider {
  readonly name: string
  // Mode uji: tidak ada uang sungguhan, paywall memberi tahu pemakainya.
  readonly test: boolean
  // Pembayaran bisa dipalsukan dari dalam aplikasi (hanya mock).
  readonly simulatable: boolean
  createCharge(input: ChargeInput): Promise<Charge>
  // null = tanda tangan atau isi notifikasi tidak sah.
  verifyWebhook(req: Request): Promise<WebhookEvent | null>
}
