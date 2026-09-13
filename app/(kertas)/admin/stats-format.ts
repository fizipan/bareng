// Pembantu angka untuk tab Statistik, dipakai bagian server maupun grafik
// yang jalan di browser.
export const pct = (n: number, of: number) => (of > 0 ? Math.round((n / of) * 100) : 0)

export const rupiah = (n: number) =>
  n >= 1_000_000
    ? `Rp${new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(n)}`
    : `Rp${new Intl.NumberFormat("id-ID").format(n)}`

const dateOf = (day: string) => new Date(`${day}T00:00:00Z`)
export const shortDate = (day: string) =>
  new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" }).format(dateOf(day))
export const longDate = (day: string) =>
  new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }).format(dateOf(day))
export const weekday = (day: string) =>
  new Intl.DateTimeFormat("id-ID", { weekday: "short", timeZone: "UTC" }).format(dateOf(day))

// Batas atas grafik yang enak dibaca: 1, 2, 5, 10, 20, 50, …
export const niceMax = (n: number) => {
  if (n <= 2) return 2
  const base = 10 ** Math.floor(Math.log10(n))
  return ([1, 2, 5, 10].find((m) => m * base >= n) ?? 10) * base
}

// Lama sesi dalam bahasa manusia: 48 dtk · 2 mnt 10 dtk · 1 j 5 mnt.
export const durasi = (sec: number | null) => {
  if (sec == null) return "–"
  if (sec < 60) return `${Math.round(sec)} dtk`
  if (sec < 3600) {
    const m = Math.floor(sec / 60)
    const s = Math.round(sec % 60)
    return s ? `${m} mnt ${s} dtk` : `${m} mnt`
  }
  const h = Math.floor(sec / 3600)
  const m = Math.round((sec % 3600) / 60)
  return m ? `${h} j ${m} mnt` : `${h} j`
}

// Jam WIB sebagai label pendek: 0 → "00", 13 → "13".
export const jam = (h: number) => String(h).padStart(2, "0")
