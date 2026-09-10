import type { Metadata } from "next"
import { Bricolage_Grotesque, Inter } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { BRAND, SITE_URL } from "@/lib/brand"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

// Display & angka besar (headline, countdown, kode room). opsz ikut ukuran teks.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND} — photobooth online berdua`,
    template: `%s · ${BRAND}`,
  },
  description: "Photobooth online untuk kamu dan dia. Buka link, hitung mundur bareng, jadi.",
  applicationName: BRAND,
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${inter.variable} ${bricolage.variable}`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
