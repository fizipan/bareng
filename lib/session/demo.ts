import type { Frame } from "./types"

// Frame placeholder (pola bergaris) selama foto asli belum ada.
export const placeholderFrame = (idx: number): Frame => ({
  a: { kind: "look", look: idx },
  b: { kind: "look", look: idx },
})

export const DEMO_FRAMES = [0, 1, 2, 3].map(placeholderFrame)

// Hasil contoh untuk /p/contoh selama M1 (M5: data asli dari Supabase).
export const DEMO_RESULT = {
  slug: "contoh",
  templateId: "film",
  names: "Rara & Dimas",
  createdAt: new Date("2026-09-10T21:04:00+07:00"),
  frames: DEMO_FRAMES,
}
