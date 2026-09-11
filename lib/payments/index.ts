import { mockProvider } from "./mock"
import type { PaymentProvider } from "./provider"

export type { PaymentProvider } from "./provider"

// Gateway aktif dari env PAYMENT_PROVIDER (bawaan: "mock"). Nama lain yang
// belum dipasang → null, route membalas "pembayaran belum tersedia".
export function paymentProvider(): PaymentProvider | null {
  const name = process.env.PAYMENT_PROVIDER ?? "mock"
  if (name === "mock") return mockProvider
  return null
}
