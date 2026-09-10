import type { Metadata } from "next"
import { StartScreen } from "@/components/session/screens/start-screen"

export const metadata: Metadata = { title: "Mulai foto bareng", robots: { index: false } }

export default function StartPage() {
  return <StartScreen />
}
