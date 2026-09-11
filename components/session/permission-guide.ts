export type Device = "Kamera" | "Mikrofon"
export type Guide = { browser: string; steps: string[]; note?: string }

// Panduan menyalakan izin kamera/mic per browser (PRD R2). Deteksi kasar dari
// user agent; kalau tidak dikenali, langkah umum Chrome/Edge.
export function guideFor(device: Device): Guide {
  const ua = navigator.userAgent
  const touch = navigator.maxTouchPoints > 1
  const lower = device.toLowerCase()
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && touch)
  if (ios && /CriOS|FxiOS|EdgiOS/.test(ua)) {
    return {
      browser: "Browser di iPhone",
      steps: [`Buka Pengaturan iPhone, cari aplikasi browser ini.`, `Nyalakan ${device}.`, "Balik ke sini, lalu coba lagi."],
    }
  }
  if (ios) {
    return {
      browser: "Safari di iPhone",
      steps: [
        "Ketuk ikon aA (atau ⋯) di sebelah alamat web.",
        `Pilih Pengaturan Situs Web, lalu ubah ${device} jadi Izinkan.`,
        "Muat ulang halaman ini.",
      ],
      note: `Masih diblokir? Buka Pengaturan iPhone → Apps → Safari → ${device} → Izinkan.`,
    }
  }
  if (/SamsungBrowser/.test(ua)) {
    return {
      browser: "Samsung Internet",
      steps: ["Ketuk ikon gembok di kiri alamat web.", `Pilih Izin, lalu nyalakan ${device}.`, "Balik ke sini, lalu coba lagi."],
    }
  }
  if (/Android/.test(ua)) {
    return {
      browser: "Chrome di Android",
      steps: [
        "Ketuk ikon di kiri alamat web (gembok atau setelan).",
        `Pilih Izin → ${device} → Izinkan.`,
        "Balik ke sini, lalu coba lagi.",
      ],
      note: `Masih diblokir? Buka Setelan HP → Aplikasi → Chrome → Izin → ${device} → Izinkan.`,
    }
  }
  if (/Firefox/.test(ua)) {
    return {
      browser: "Firefox",
      steps: [`Klik ikon ${lower} bercoret di kolom alamat.`, `Hapus blokir ${lower} untuk situs ini.`, "Coba lagi."],
    }
  }
  if (/Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua)) {
    return {
      browser: "Safari di Mac",
      steps: ["Buka menu Safari → Pengaturan untuk situs ini.", `Ubah ${device} jadi Izinkan.`, "Coba lagi."],
    }
  }
  return {
    browser: "Chrome / Edge",
    steps: ["Klik ikon di kiri alamat web.", `Ubah ${device} jadi Izinkan.`, "Coba lagi."],
  }
}
