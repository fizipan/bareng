import type { Metadata } from "next"
import { PrivacyContent } from "@/components/legal/privacy-content"

export const metadata: Metadata = {
  title: "Privasi",
  description: "Video kalian nggak lewat kami. Yang tersimpan cuma photostrip jadinya, dan hanya bisa dibuka lewat link kalian.",
}

export default function PrivacyPage() {
  return <PrivacyContent />
}
