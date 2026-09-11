import { FREE_SESSIONS_PER_DAY } from "./pricing"

// Pesan saat room gagal dibuat, dari kode error RPC create_room. Sengaja tanpa
// impor kode sesi supaya bisa dipakai tombol di landing.
export function createRoomError(e: unknown) {
  const code = (e as { code?: unknown } | null)?.code
  if (code === "daily_limit") {
    return `Sesi gratis hari ini sudah ${FREE_SESSIONS_PER_DAY}×. Minta dia yang buat room, atau lanjut besok ya`
  }
  if (code === "rate_limited") return "Terlalu sering bikin room, tunggu sebentar ya"
  return "Belum bisa bikin room, coba lagi sebentar"
}

// Kuota gratis harian habis → tawarkan sesi premium (lembar kuota).
export const isDailyLimit = (e: unknown) => (e as { code?: unknown } | null)?.code === "daily_limit"
