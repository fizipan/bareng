import { FREE_SESSIONS_PER_DAY, PREMIUM_PRICE_LABEL } from "./pricing"

export const FAQ = [
  { q: "Harus daftar dulu?", a: "Nggak usah. Klik link, nyalakan kamera, langsung foto." },
  { q: "Perlu install aplikasi?", a: "Nggak. Semuanya jalan di browser, di HP atau laptop. Cukup buka link-nya." },
  { q: "Bisa dipakai di HP apa aja?", a: "Bisa. Android atau iPhone, pakai browser biasa. Sinyal 4G cukup." },
  { q: "Satu room bisa berapa orang?", a: "Dua orang, kamu dan dia. Kalau ada orang ketiga, dia perlu buat room sendiri." },
  {
    q: "Foto kami aman?",
    a: "Aman. Video cuma lewat langsung antara HP kalian dan nggak direkam. Yang kami simpan cuma foto hasilnya, tanpa galeri publik.",
  },
  { q: "Kalau ada foto yang jelek?", a: "Ketuk foto itu di layar review, lalu ulang yang itu aja. Foto lainnya tetap aman." },
  {
    q: "Kalau sinyal putus di tengah sesi?",
    a: "Foto yang sudah diambil nggak hilang. Room nunggu 5 menit supaya kalian bisa sambung lagi dan lanjut.",
  },
  {
    q: "Kamera kok nggak nyala?",
    a: "Biasanya izin kamera belum dikasih. Buka pengaturan situs di browser, izinkan kamera, lalu muat ulang halamannya.",
  },
  { q: "Hasilnya bisa disimpan berapa lama?", a: "Tujuh hari kalau gratis. Kalau premium, tersimpan terus sampai kalian hapus." },
  {
    q: "Kalau kuota gratis harian habis?",
    a: `Gratis ${FREE_SESSIONS_PER_DAY} sesi per hari per HP. Kalau habis, kamu bisa lanjut dengan sesi premium ${PREMIUM_PRICE_LABEL} (bayar sebelum mulai foto), minta pasanganmu yang bikin room, atau tunggu besok karena kuotanya balik lagi.`,
  },
  {
    q: "Bayarnya pakai apa?",
    a: `QRIS, jadi bisa dari GoPay, OVO, DANA, ShopeePay, atau m-banking. Sekali bayar ${PREMIUM_PRICE_LABEL} berlaku untuk kalian berdua.`,
  },
] as const
