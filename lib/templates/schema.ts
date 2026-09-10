import { z } from "zod"

// Skema template photostrip (PRD §9), versi yang dipakai DOM preview dan
// renderer canvas. Semua koordinat dalam unit kanvas; renderer menskalakan.
// Token teks: {{date}} tanggal sesi, {{host}} host situs (watermark).

const color = z.string().min(1)

export const stripSlotSchema = z.object({
  index: z.number().int().min(0),
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
  radius: z.number().min(0).default(0),
  border: z.object({ width: z.number().positive(), color }).nullable(),
  // side-by-side: A kiri, B kanan. alternate/split-blend disiapkan untuk template berikutnya.
  layout: z.enum(["side-by-side", "alternate", "split-blend"]),
  gap: z.number().min(0),
  background: color,
})

export const stripOverlaySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("rect"), x: z.number(), y: z.number(), w: z.number(), h: z.number(), color }),
  // Lubang film vertikal berulang: `hole` panjang lubang, `pitch` jarak antar awal lubang.
  z.object({
    type: z.literal("sprockets"),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
    color,
    hole: z.number().positive(),
    pitch: z.number().positive(),
  }),
  // Hati = kotak berujung bulat diputar 45°; (x, y) sudut kiri atas sebelum diputar.
  z.object({ type: z.literal("heart"), x: z.number(), y: z.number(), size: z.number().positive(), color }),
  z.object({ type: z.literal("image"), src: z.string(), x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
])

export const stripTextSchema = z.object({
  key: z.string(),
  x: z.number(),
  // baseline "bottom": y = tepi bawah teks; "middle": y = tengah teks.
  y: z.number(),
  baseline: z.enum(["bottom", "middle"]),
  align: z.enum(["left", "right", "center"]),
  size: z.number().positive(),
  font: z.enum(["display", "sans", "mono"]),
  weight: z.number().int(),
  color,
  value: z.string(),
})

export const stripTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tier: z.enum(["free", "premium"]),
  version: z.literal(1),
  canvas: z.object({ width: z.number().positive(), height: z.number().positive() }),
  background: z.object({ type: z.literal("color"), value: color }),
  ink: color,
  slots: z.array(stripSlotSchema).length(4),
  overlays: z.array(stripOverlaySchema),
  text: z.array(stripTextSchema),
  // Watermark versi gratis, rata kanan di (x, y) dengan baseline bawah.
  watermark: z.object({ x: z.number(), y: z.number(), size: z.number().positive(), color }),
  // Ciri visual untuk thumbnail kecil (picker lobby, landing).
  preview: z.object({
    cols: z.union([z.literal(1), z.literal(2)]),
    sprockets: z.boolean(),
    band: color.nullable(),
    slotBorder: color.nullable(),
    note: z.string(),
    noteColor: color,
  }),
  filter: z.string().nullable(),
  creator: z.object({ name: z.string(), url: z.string().optional() }).nullable(),
})

export type StripSlot = z.infer<typeof stripSlotSchema>
export type StripOverlay = z.infer<typeof stripOverlaySchema>
export type StripText = z.infer<typeof stripTextSchema>
export type StripTemplate = z.infer<typeof stripTemplateSchema>
export type TemplateTier = StripTemplate["tier"]

export type StripTokens = { date: string; host: string }

export function fillTokens(value: string, tokens: StripTokens) {
  return value.replace(/\{\{(date|host)\}\}/g, (_, key: keyof StripTokens) => tokens[key])
}
