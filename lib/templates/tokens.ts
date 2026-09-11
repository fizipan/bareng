// Token teks template ({{date}}, {{host}}, {{names}}). Terpisah dari skema zod
// supaya komponen strip di landing tidak ikut memuat zod.
export type StripTokens = { date: string; host: string; names?: string | null }

// Nama berdua tampil kalau keduanya mengisi nama panggilan (sama dengan
// results.names di server); belum → teks bawaan. Dipotong supaya muat.
const DEFAULT_NAMES = "kamu & dia"
const NAMES_MAX = 28

const namesText = (names?: string | null) => {
  const clean = names?.trim()
  if (!clean) return DEFAULT_NAMES
  return clean.length > NAMES_MAX ? `${clean.slice(0, NAMES_MAX - 1).trimEnd()}…` : clean
}

export function fillTokens(value: string, tokens: StripTokens) {
  return value.replace(/\{\{(date|host|names)\}\}/g, (_, key: "date" | "host" | "names") =>
    key === "names" ? namesText(tokens.names) : tokens[key]
  )
}
