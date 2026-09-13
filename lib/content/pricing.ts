export const PREMIUM_PRICE = 15000
export const PREMIUM_PRICE_LABEL = "Rp15.000"
export const PREMIUM_PRICE_SHORT = "Rp15rb"

// Saklar pembayaran. Selama gateway-nya masih disiapkan, semua tombol bayar
// diganti keterangan "masih dikembangkan" + ajakan kirim masukan, dan
// /api/payments menolak. Nyalakan dengan NEXT_PUBLIC_PAYMENTS_LIVE=1 (sudah
// menyala di .env.local supaya dev & E2E tetap bisa menguji alur bayar penuh).
export const PAYMENTS_LIVE = process.env.NEXT_PUBLIC_PAYMENTS_LIVE === "1"
// Batas sesi gratis per perangkat per hari (WIB); dicek RPC create_room.
export const FREE_SESSIONS_PER_DAY = 3
