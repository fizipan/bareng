import { notFound } from "next/navigation"
import { ScreensGallery } from "@/components/dev/screens-gallery"

export const metadata = { title: "Layar", robots: { index: false } }

export default function DevScreensPage() {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_DEV_PAGES !== "1") notFound()
  return <ScreensGallery />
}
