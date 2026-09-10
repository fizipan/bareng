// Pool pose prompt (PRD P1: 30 prompt, bisa di-skip). 10 pertama dari prototipe.
export const POSE_PROMPTS = [
  "Hadap kiri",
  "Peace ✌️",
  "Pura-pura kaget",
  "Pegang muka",
  "Tutup satu mata",
  "Tunjuk dia",
  "Ketawa lebar",
  "Muka datar",
  "Tangan di dagu",
  "Lompat kecil",
  "Hadap kanan",
  "Bikin hati pakai tangan 🫶",
  "Gaya foto KTP",
  "Senyum tanpa gigi",
  "Lihat ke atas",
  "Pura-pura bisik",
  "Jempol dua 👍",
  "Muka ngambek",
  "Tahan tawa",
  "Kedip ke kamera",
  "Pose model majalah",
  "Pura-pura nangis",
  "Tangan di pipi",
  "Gaya superhero",
  "Pegang kepala",
  "Julurkan lidah",
  "Lihat ke samping",
  "Tepuk tangan",
  "Gaya salaman",
  "Pose bebas",
] as const

export function randomPrompt(exclude?: string) {
  const pool = POSE_PROMPTS.filter((p) => p !== exclude)
  return pool[Math.floor(Math.random() * pool.length)]
}
