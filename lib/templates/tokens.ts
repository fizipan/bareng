// Token teks template ({{date}}, {{host}}). Terpisah dari skema zod supaya
// komponen strip di landing tidak ikut memuat zod.
export type StripTokens = { date: string; host: string }

export function fillTokens(value: string, tokens: StripTokens) {
  return value.replace(/\{\{(date|host)\}\}/g, (_, key: keyof StripTokens) => tokens[key])
}
