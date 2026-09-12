import { parseUserAgent } from "@/lib/device-info"

export type Device = "Kamera" | "Mikrofon"
export type Guide = { browser: string; steps: string[]; note?: string }

// Panduan menyalakan izin kamera/mic per browser (PRD R2). Deteksi kasar dari
// user agent; kalau tidak dikenali, langkah umum Chrome/Edge.
export function guideFor(device: Device, state?: PermissionState | "unsupported"): Guide {
  const ua = navigator.userAgent
  const touch = navigator.maxTouchPoints > 1
  const lower = device.toLowerCase()
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && touch)
  // Browser di dalam aplikasi (link dibuka dari chat/sosmed) sering memblokir
  // kamera & mic, dan tidak punya setelan izin sama sekali.
  const inApp = parseUserAgent(ua).inApp
  const samsung = /SamsungBrowser/.test(ua)
  const appName = samsung ? "Samsung Internet" : ios ? "Safari" : "Chrome"
  if (inApp) {
    return {
      browser: `Browser dalam ${inApp}`,
      steps: [
        `${device} sering diblokir kalau Bareng dibuka di dalam ${inApp}.`,
        ios ? "Ketuk ikon ⋯ (atau kompas) di pojok, pilih Buka di Safari." : "Ketuk ikon ⋮ di pojok, pilih Buka di browser / Chrome.",
        "Kalau tidak ada pilihannya: salin link room ini, lalu tempel di Chrome atau Safari.",
      ],
      note: "Link room tetap sama, jadi kamu tidak perlu bikin ulang.",
    }
  }
  // Ditolak seketika padahal izin situs masih "prompt": biasanya aplikasi
  // browsernya sendiri yang belum dikasih izin di setelan HP.
  if (state === "prompt" && /Android/.test(ua)) {
    return {
      browser: "Izin di setelan HP",
      steps: [
        `Buka Setelan HP → Aplikasi → ${appName} → Izin.`,
        `Nyalakan ${device}, lalu balik ke sini.`,
        "Ketuk “Sudah, coba lagi” di bawah.",
      ],
      note: `Kalau di setelan HP sudah nyala: ketuk ikon di kiri alamat web → Izin → ${device} → Izinkan.`,
    }
  }
  if (state === "prompt" && ios) {
    return {
      browser: "Izin di Pengaturan iPhone",
      steps: [
        `Buka Pengaturan iPhone → Privasi & Keamanan → ${device}.`,
        `Nyalakan ${appName}, lalu balik ke sini.`,
        "Ketuk “Sudah, coba lagi” di bawah.",
      ],
      note: `Kalau sudah nyala: ketuk aA di sebelah alamat web → Pengaturan Situs Web → ${device} → Izinkan.`,
    }
  }
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
