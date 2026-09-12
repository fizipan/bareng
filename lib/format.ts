const pad = (n: number) => String(n).padStart(2, "0")

// Tanggal di strip: 10.09.26
export function formatStripDate(date: Date) {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${String(date.getFullYear()).slice(-2)}`
}

// Tanggal panjang: 10 September 2026
// "hari ini" / "besok" / "6 hari lagi" — batas waktu apa adanya.
export function daysLeft(at: number, now = Date.now()) {
  const days = Math.ceil((at - now) / 86_400_000)
  if (days <= 0) return "hari ini"
  if (days === 1) return "besok"
  return `${days} hari lagi`
}

export function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date)
}
