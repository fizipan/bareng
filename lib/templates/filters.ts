// Filter seragam untuk kedua feed (PRD P1, sudah ada di prototipe).
// `css` dipakai preview live; hasil akhir memakai matriks warna yang setara (M5).
export const FILTERS = [
  { id: "none", name: "Tanpa filter", css: "none" },
  { id: "grain", name: "Grain hangat", css: "sepia(.35) saturate(.9) contrast(1.05)" },
  { id: "bw", name: "Hitam putih", css: "grayscale(1) contrast(1.08)" },
  { id: "vhs", name: "VHS", css: "saturate(1.4) hue-rotate(-12deg) contrast(1.15)" },
] as const

export type FilterId = (typeof FILTERS)[number]["id"]

export function getFilter(id: string | null | undefined) {
  return FILTERS.find((f) => f.id === id) ?? FILTERS[0]
}
