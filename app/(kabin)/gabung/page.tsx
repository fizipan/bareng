import type { Metadata } from "next"
import { JoinScreen } from "@/components/session/screens/join-screen"

export const metadata: Metadata = {
  title: "Gabung ke room",
  description: "Masukin kode 6 huruf dari dia, lalu foto bareng. Nggak perlu daftar.",
}

export default function JoinPage() {
  return <JoinScreen />
}
