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
