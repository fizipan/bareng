// State error PRD §15.5: apa yang terjadi, kenapa, satu tombol tindakan.
export const ERROR_COPY = {
  camera: {
    title: "Kamera belum diizinkan",
    why: "Kamera masih dimatikan di HP kamu, jadi kami belum bisa ambil foto.",
    cta: "Cara mengaktifkan",
  },
  penuh: {
    title: "Room ini sudah penuh",
    why: "Satu room cuma untuk dua orang. Yang ketiga harus buat room sendiri.",
    cta: "Buat room baru",
  },
  putus: {
    title: "Sambungan dia putus",
    why: "Kami lagi coba sambungin lagi. Foto yang sudah diambil aman, room nunggu 5 menit.",
    cta: "Coba sambung ulang",
  },
  kadaluarsa: {
    title: "Room ini sudah kedaluwarsa",
    why: "Nggak ada yang masuk lebih dari 15 menit, jadi room ini kami tutup.",
    cta: "Buat room baru",
  },
  jaringan: {
    title: "Belum bisa nyambung",
    why: "Internet kamu atau server kami lagi bermasalah. Tunggu sebentar, lalu coba lagi.",
    cta: "Coba lagi",
  },
  "tidak-ada": {
    title: "Room nggak ketemu",
    why: "Kodenya mungkin salah ketik, atau room-nya sudah ditutup.",
    cta: "Buat room baru",
  },
} as const

export type ErrorKind = keyof typeof ERROR_COPY
