import { z } from "zod"
import { PAYMENTS_LIVE } from "@/lib/content/pricing"
import { paymentProvider } from "@/lib/payments"
import { mockWebhookRequest } from "@/lib/payments/mock"
import { POST as webhook } from "../webhook/route"

const body = z.object({
  orderId: z.string().regex(/^BRG-[A-Z0-9]{12}$/),
  outcome: z.enum(["paid", "failed"]),
})

// Mode uji saja: tombol "Simulasikan bayar/gagal" di paywall meniru notifikasi
// gateway, bertanda tangan, dan lewat webhook yang sama persis dengan
// pembayaran sungguhan.
export async function POST(req: Request) {
  if (!PAYMENTS_LIVE || paymentProvider()?.name !== "mock") return Response.json({ error: "not_found" }, { status: 404 })
  const parsed = body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 })
  const url = new URL("/api/payments/webhook", req.url).toString()
  return webhook(mockWebhookRequest(url, parsed.data.orderId, parsed.data.outcome))
}
