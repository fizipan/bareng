import type { Metadata } from "next"
import { HelpContent } from "@/components/help/help-content"

export const metadata: Metadata = {
  title: "Pusat bantuan",
  description: "Masalah umum saat foto bareng, dan form untuk kirim masukan atau laporkan bug.",
}

export default async function HelpPage({ searchParams }: PageProps<"/bantuan">) {
  const { jenis, room } = await searchParams
  return <HelpContent initialKind={typeof jenis === "string" ? jenis : null} initialRoom={typeof room === "string" ? room : null} />
}
