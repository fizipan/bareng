import { FREE_SESSIONS_PER_DAY, PREMIUM_PRICE_LABEL } from "./pricing"

// Masalah umum di Pusat bantuan (/bantuan).
export const HELP_TOPICS = [
  {
    q: "Kamera nggak mau nyala",
    a: "Pastikan izin kamera untuk situs ini diizinkan (ikon di kiri alamat web). Tutup aplikasi lain yang sedang memakai kamera, seperti Zoom atau Meet, lalu muat ulang halaman. Di iPhone, pakai Safari versi terbaru.",
  },
  {
    q: "Video dia nggak muncul atau putus-putus",
    a: "Biasanya karena sinyal lemah atau Wi-Fi kantor/kampus yang membatasi sambungan. Coba pindah ke data seluler atau Wi-Fi lain. Kami menyambung ulang otomatis sampai 3 kali; kalau masih putus, muat ulang halaman di dua HP.",
  },
  {
    q: "Suara dia nggak kedengaran",
    a: "Mic mati dulu secara bawaan. Minta dia ketuk “Nyalakan mic” di videonya. Cek juga volume dan mode senyap HP, lalu ketuk layar sekali, karena browser kadang menahan suara sampai layar disentuh.",
  },
  {
    q: "Mic nggak bisa dinyalakan",
    a: "Kalau link-nya kamu buka dari dalam aplikasi (WhatsApp, Instagram, TikTok), mic sering diblokir dari sana: ketuk menu titik tiga lalu pilih “Buka di browser”, atau tempel link room-nya di Chrome/Safari. Kalau sudah di browser biasa, cek izin mikrofon untuk situs ini, dan tutup aplikasi lain yang sedang memakai mic (telepon WhatsApp, Zoom).",
  },
  {
    q: "Kuota gratis hari ini habis",
    a: `Gratis ${FREE_SESSIONS_PER_DAY} sesi per hari per HP, dan kuotanya balik tiap hari jam 00.00 WIB. Kalau mau lanjut sekarang: pilih “Lanjut premium” (${PREMIUM_PRICE_LABEL} sekali, berlaku buat kalian berdua), atau minta pasanganmu yang bikin room karena kuotanya terpisah.`,
  },
  {
    q: "Sudah bayar tapi masih ada watermark",
    a: "Tunggu beberapa detik: begitu pembayaran masuk, dua HP otomatis jadi premium dan photostrip-nya dirender ulang tanpa watermark. Kalau lewat satu menit masih sama, muat ulang halaman hasil. Masih belum berubah? Kirim pesan lewat form di bawah beserta kode room-nya.",
  },
  {
    q: "Photostrip nggak bisa diunduh di iPhone",
    a: "Di iPhone, tombol unduh membuka menu bagikan. Pilih “Simpan Gambar” supaya masuk ke aplikasi Foto.",
  },
  {
    q: "Link photostrip nggak bisa dibuka",
    a: "Photostrip gratis tersimpan 7 hari, lalu terhapus otomatis. Link juga mati kalau photostrip dihapus salah satu dari kalian, atau diturunkan karena melanggar ketentuan.",
  },
  {
    q: "Room penuh atau sudah kedaluwarsa",
    a: "Satu room untuk dua orang. Room juga berhenti kalau 15 menit dia belum masuk. Bikin room baru dari beranda, lalu kirim link-nya lagi.",
  },
] as const
