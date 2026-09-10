import type { Metadata, Viewport } from "next"
import { SessionApp } from "@/components/session/session-app"

export const metadata: Metadata = {
  title: "Diajak foto bareng",
  description: "Klik, nyalakan kamera, hitung mundur bareng. Nggak perlu daftar.",
  robots: { index: false },
}

export const viewport: Viewport = { themeColor: "#16141D" }

export default async function RoomPage({ params }: PageProps<"/r/[code]">) {
  const { code } = await params
  return <SessionApp code={code.toUpperCase()} />
}
