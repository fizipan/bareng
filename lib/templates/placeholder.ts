// Pola bergaris pengganti foto (prototipe `STRIPE`/`LOOKS`): dipakai selama
// kamera belum ada, di thumbnail template, dan di halaman dev.
export const LOOKS = [
  ["#40384A", "#372F41"],
  ["#463C33", "#3D342C"],
  ["#33443F", "#2C3B37"],
  ["#4A3A3E", "#413135"],
] as const

export function stripe(a: string, b: string, size = 9) {
  return `repeating-linear-gradient(135deg, ${a} 0 ${size}px, ${b} ${size}px ${size * 2}px)`
}

// Sisi A dan B dibalik warnanya supaya dua orang dalam satu frame terlihat beda.
export function lookBackground(look: number, side: "a" | "b", size?: number) {
  const [c1, c2] = LOOKS[look % LOOKS.length]
  return side === "a" ? stripe(c1, c2, size) : stripe(c2, c1, size)
}

export const LIVE_A = stripe("#2A2636", "#232030")
export const LIVE_B = stripe("#262233", "#1F1C2B")
