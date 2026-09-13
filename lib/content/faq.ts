import { FREE_SESSIONS_PER_DAY, PREMIUM_PRICE_LABEL } from "./pricing"

export type FaqItem = { q: string; a: string }

const BASE: FaqItem[] = [
  { q: "Harus daftar dulu?", a: "Nggak usah. Klik link, nyalakan kamera, langsung foto." },
  { q: "Perlu install aplikasi?", a: "Nggak. Semuanya jalan di browser, di HP atau laptop. Cukup buka link-nya." },
  {
    q: "Bisa dipakai di HP apa aja?",
    a: "Bisa. Android atau iPhone, pakai browser biasa seperti Chrome atau Safari, dan sinyal 4G cukup. Kalau link-nya kamu buka dari dalam aplikasi chat atau sosmed, pilih dulu “Buka di browser”, karena di sana kamera & mic sering diblokir.",
  },
  { q: "Satu room bisa berapa orang?", a: "Dua orang, kamu dan dia. Kalau ada orang ketiga, dia perlu buat room sendiri." },
  {
    q: "Foto kami aman?",
    a: "Aman. Video cuma lewat langsung antara HP kalian dan nggak direkam. Yang kami simpan cuma foto hasilnya, tanpa galeri publik.",
  },
  { q: "Kalau ada foto yang jelek?", a: "Ketuk foto itu di layar review, lalu ulang yang itu aja. Foto lainnya tetap aman." },
  {
    q: "Kalau sinyal putus di tengah sesi?",
    a: "Foto yang sudah diambil nggak hilang. Kami nyambungin ulang otomatis; kalau tetap putus, buka lagi link room-nya dan lanjut dari foto terakhir. Room-nya hidup sampai sejam sejak dia masuk.",
  },
  {
    q: "Kamera kok nggak nyala?",
    a: "Biasanya izin kamera belum dikasih. Buka pengaturan situs di browser, izinkan kamera, lalu muat ulang halamannya.",
  },
  {
    q: "Bisa ngobrol sambil foto?",
    a: "Bisa. Mic-nya mati dulu secara bawaan; ketuk “Nyalakan mic” di video kamu, lalu izinkan saat browser bertanya. Pakai earphone biar suaranya nggak menggema.",
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
]

// Selama pembayaran belum bisa dipakai sungguhan, jawaban soal bayar ikut jujur.
export function faqList(testMode: boolean): FaqItem[] {
  if (!testMode) return BASE
  return BASE.map((item) =>
    item.q === "Bayarnya pakai apa?"
      ? { ...item, a: `${item.a} Sekarang pembayarannya masih kami siapkan, jadi sesi premium belum bisa dibeli.` }
      : item
  )
}
