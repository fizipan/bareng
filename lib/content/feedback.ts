// Jenis masukan di Pusat bantuan (/bantuan), dipakai form, email, & /admin.
export const FEEDBACK_KINDS = [
  { id: "bug", label: "Bug", hint: "Ada yang error atau nggak jalan", placeholder: "Apa yang terjadi? Tulis langkahnya, dan apa yang seharusnya terjadi." },
  { id: "masukan", label: "Masukan", hint: "Ide atau saran fitur", placeholder: "Ide atau saran apa yang bikin Bareng lebih enak dipakai?" },
  { id: "pertanyaan", label: "Pertanyaan", hint: "Bingung cara pakainya", placeholder: "Tulis pertanyaanmu. Isi email di bawah biar bisa kami balas." },
  { id: "lainnya", label: "Lainnya", hint: "Hal lain", placeholder: "Ceritakan ke kami." },
] as const

export type FeedbackKind = (typeof FEEDBACK_KINDS)[number]["id"]
export const FEEDBACK_MIN = 10
export const FEEDBACK_MAX = 1000

export const feedbackLabel = (id: string) => FEEDBACK_KINDS.find((k) => k.id === id)?.label ?? "Lainnya"
