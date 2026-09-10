import type { Viewport } from "next"
import { ModeRoot } from "@/components/brand/mode-root"

export const viewport: Viewport = { themeColor: "#F4F3EF" }

export default function KertasLayout({ children }: { children: React.ReactNode }) {
  return <ModeRoot mode="kertas">{children}</ModeRoot>
}
