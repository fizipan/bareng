import type { Metadata } from "next"
import { Landing } from "@/components/landing/landing"

export const metadata: Metadata = { alternates: { canonical: "/" } }

export default function LandingPage() {
  return <Landing />
}
