import type { Metadata } from "next"
import { TermsContent } from "@/components/legal/terms-content"
import { BRAND } from "@/lib/brand"

export const metadata: Metadata = {
  title: "Ketentuan pakai",
  description: `Ketentuan pakai ${BRAND}, ditulis sependek mungkin.`,
}

export default function TermsPage() {
  return <TermsContent />
}
