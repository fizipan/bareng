// Alasan laporan di halaman publik (dipakai dialog lapor, email, & /admin).
export const REPORT_REASONS = [
  { id: "seksual-kekerasan", label: "Konten seksual atau kekerasan", hint: "Foto yang tidak pantas dilihat orang lain." },
  { id: "tanpa-izin", label: "Foto diambil tanpa izin", hint: "Ada orang di foto ini yang tidak setuju dibagikan." },
  { id: "spam", label: "Spam atau penipuan", hint: "Link dipakai untuk iklan, jualan, atau menipu." },
  { id: "lainnya", label: "Lainnya", hint: "Ceritakan singkat di catatan." },
] as const

export type ReportReason = (typeof REPORT_REASONS)[number]["id"]

// "Lainnya" wajib pakai catatan supaya bisa ditindaklanjuti.
export const NOTE_MAX = 300
export const NOTE_MIN_OTHER = 5

export const reasonLabel = (id: string | null | undefined) =>
  REPORT_REASONS.find((r) => r.id === id)?.label ?? "Tanpa alasan"
