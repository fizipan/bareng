import { notFound } from "next/navigation"
import { DesignSystem } from "@/components/dev/design-system"

export const metadata = { title: "Design system", robots: { index: false } }

// Halaman dev hanya hidup di lokal / preview (NEXT_PUBLIC_DEV_PAGES=1).
export default function DevPage() {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_DEV_PAGES !== "1") notFound()
  return <DesignSystem />
}
