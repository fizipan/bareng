const pad = (n: number) => String(n).padStart(2, "0")

// Tanggal di strip: 10.09.26
export function formatStripDate(date: Date) {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${String(date.getFullYear()).slice(-2)}`
}

// Tanggal panjang: 10 September 2026
export function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date)
}
