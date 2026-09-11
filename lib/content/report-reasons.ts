// Alasan laporan di halaman publik (dipakai dialog lapor, email, & /admin).
export const REPORT_REASONS = [
  { id: "seksual-kekerasan", label: "Konten seksual atau kekerasan" },
  { id: "tanpa-izin", label: "Foto diambil tanpa izin" },
  { id: "spam", label: "Spam atau penipuan" },
  { id: "lainnya", label: "Lainnya" },
] as const

export type ReportReason = (typeof REPORT_REASONS)[number]["id"]

export const reasonLabel = (id: string | null | undefined) =>
  REPORT_REASONS.find((r) => r.id === id)?.label ?? "Tanpa alasan"
