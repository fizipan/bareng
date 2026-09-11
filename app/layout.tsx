import type { Metadata } from "next"
import { Bricolage_Grotesque, Inter } from "next/font/google"
import { PwaProvider } from "@/components/pwa/pwa-provider"
import { HelpFab } from "@/components/help/help-fab"
import { QuotaSheet } from "@/components/session/quota-sheet"
import { Toaster } from "@/components/ui/sonner"
import { BRAND, SITE_URL } from "@/lib/brand"
import { APPLE_STARTUP_IMAGES } from "@/lib/pwa"
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

const TITLE = `${BRAND} — photobooth online berdua`
const DESCRIPTION = "Photobooth online untuk kamu dan dia. Buka link, hitung mundur bareng, jadi satu photostrip. Gratis, tanpa akun."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: `%s · ${BRAND}` },
  description: DESCRIPTION,
  applicationName: BRAND,
  keywords: ["photobooth online", "foto bareng online", "photobooth LDR", "photostrip", "foto jarak jauh", "photobooth berdua"],
  authors: [{ name: BRAND }],
  creator: BRAND,
  category: "photography",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: BRAND,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  // iOS: buka tanpa bilah Safari saat dipasang ke layar utama, dengan splash sendiri.
  appleWebApp: { capable: true, title: BRAND, statusBarStyle: "default", startupImage: APPLE_STARTUP_IMAGES },
  formatDetection: { telephone: false, email: false, address: false },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" data-scroll-behavior="smooth" className={`${inter.variable} ${bricolage.variable}`}>
      <body>
        {children}
        <Toaster />
        <PwaProvider />
        <HelpFab />
        <QuotaSheet />
      </body>
    </html>
  )
}
