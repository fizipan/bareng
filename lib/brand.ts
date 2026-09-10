// Nama kerja produk (PRD: placeholder, bisa diganti) dan URL publik.
export const BRAND = "Bareng"
export const SUPPORT_EMAIL = "halo@bareng.id"

// Urutan: domain yang di-set manual → URL Vercel (otomatis tersedia di build
// Vercel) → lokal. Dipakai untuk metadata & teks yang dirender server.
const vercelHost =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
    ? process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
    : process.env.NEXT_PUBLIC_VERCEL_URL
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? (vercelHost ? `https://${vercelHost}` : "http://localhost:3000")

// Host yang ditampilkan di UI (link room, watermark), tanpa protokol.
export const SITE_HOST = new URL(SITE_URL).host

// Link yang dibagikan (salin, WhatsApp) memakai domain yang sedang dibuka,
// jadi selalu benar di lokal, preview, maupun domain sendiri.
export const shareOrigin = () => (typeof window === "undefined" ? SITE_URL : window.location.origin)
