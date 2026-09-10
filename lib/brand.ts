// Nama kerja produk (PRD: placeholder, bisa diganti) dan URL publik.
export const BRAND = "Bareng"
export const SUPPORT_EMAIL = "halo@bareng.id"
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
// Host yang ditampilkan di UI (link room, watermark), tanpa protokol.
export const SITE_HOST = new URL(SITE_URL).host
