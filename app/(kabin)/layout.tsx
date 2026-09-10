import type { Viewport } from "next"
import { ModeRoot } from "@/components/brand/mode-root"

export const viewport: Viewport = { themeColor: "#16141D" }

export default function KabinLayout({ children }: { children: React.ReactNode }) {
  return <ModeRoot mode="kabin">{children}</ModeRoot>
}
