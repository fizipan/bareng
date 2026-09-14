import type { StripOverlay, StripSlot, StripTemplate, StripText } from "./schema"

// Enam template MVP, diturunkan dari `TPL` di prototipe. Ukuran ditulis dalam
// px prototipe (strip hasil lebar 212) lalu dikali SCALE jadi unit kanvas.
const PROTO_WIDTH = 212
const SCALE = 5

const SLOT_BG = "#16141D"
const SPROCKET = "rgba(22,20,29,0.18)"
const BAND_H = 7
const STACK_GAP = 8 // jarak pita ↔ grid (gap flex kolom di prototipe)

type StripParams = {
  id: string
  name: string
  tier: StripTemplate["tier"]
  paper: string
  ink: string
  pad: { top: number; x: number; bottom: number }
  gap: number
  cols: 1 | 2
  slotH: number
  slotBorder?: { width: number; color: string }
  sprockets?: boolean
  band?: string
  numbers?: boolean
  hearts?: boolean
  note: string
  // Thumbnail cuma selebar 78px: catatan panjang dipendekkan di sini supaya
  // tidak melipat dan menabrak foto. Kosong = pakai `note` apa adanya.
  previewNote?: string
  noteColor: string
}

function buildStrip(p: StripParams): StripTemplate {
  const W = PROTO_WIDTH
  const contentX = p.pad.x
  const contentW = W - 2 * p.pad.x
  const overlays: StripOverlay[] = []
  const text: StripText[] = []
  let y = p.pad.top

  if (p.band) {
    overlays.push({ type: "rect", x: contentX, y, w: contentW, h: BAND_H, color: p.band })
    y += BAND_H + STACK_GAP
  }

  const rows = 4 / p.cols
  const slotW = (contentW - (p.cols - 1) * p.gap) / p.cols
  const slots: StripSlot[] = Array.from({ length: 4 }, (_, i) => ({
    index: i,
    x: contentX + (i % p.cols) * (slotW + p.gap),
    y: y + Math.floor(i / p.cols) * (p.slotH + p.gap),
    w: slotW,
    h: p.slotH,
    radius: 0,
    border: p.slotBorder ?? null,
    layout: "side-by-side",
    gap: 2,
    background: SLOT_BG,
  }))
  y += rows * p.slotH + (rows - 1) * p.gap

  if (p.band) {
    y += STACK_GAP
    overlays.push({ type: "rect", x: contentX, y, w: contentW, h: BAND_H, color: p.band })
    y += BAND_H
  }

  const H = y + p.pad.bottom

  if (p.sprockets) {
    for (const x of [6, W - 12]) {
      overlays.push({ type: "sprockets", x, y: 6, w: 6, h: H - 12, color: SPROCKET, hole: 8, pitch: 19 })
    }
  }

  if (p.numbers) {
    for (const s of slots) {
      text.push({
        key: `number-${s.index}`,
        x: s.x + s.w + 17,
        y: s.y + s.h / 2,
        baseline: "middle",
        align: "right",
        size: 9,
        font: "mono",
        weight: 400,
        color: "#CC3A25",
        value: `0${s.index + 1}`,
      })
    }
  }

  if (p.hearts) {
    overlays.push({ type: "heart", x: W - 14 - 7 - 5 - 9, y: H - 16 - 9, size: 9, color: "#E4462E" })
    overlays.push({ type: "heart", x: W - 14 - 7, y: H - 16 - 8, size: 7, color: "#F0A79B" })
  }

  text.push(
    { key: "date", x: 18, y: H - 15, baseline: "bottom", align: "left", size: 15, font: "display", weight: 600, color: p.ink, value: "{{date}}" },
    { key: "note", x: 18, y: H - 2, baseline: "bottom", align: "left", size: 10, font: "display", weight: 600, color: p.noteColor, value: p.note }
  )

  const template: StripTemplate = {
    id: p.id,
    name: p.name,
    tier: p.tier,
    version: 1,
    canvas: { width: W, height: H },
    background: { type: "color", value: p.paper },
    ink: p.ink,
    slots,
    overlays,
    text,
    watermark: { x: W - 14, y: H - 3, size: 9, color: "#8A8894" },
    preview: {
      cols: p.cols,
      sprockets: !!p.sprockets,
      band: p.band ?? null,
      slotBorder: p.slotBorder?.color ?? null,
      note: p.previewNote ?? p.note,
      noteColor: p.noteColor,
    },
    filter: null,
    creator: null,
  }
  return scaleTemplate(template, SCALE)
}

function scaleTemplate(t: StripTemplate, k: number): StripTemplate {
  const s = (v: number) => Math.round(v * k * 100) / 100
  return {
    ...t,
    canvas: { width: s(t.canvas.width), height: s(t.canvas.height) },
    slots: t.slots.map((sl) => ({
      ...sl,
      x: s(sl.x),
      y: s(sl.y),
      w: s(sl.w),
      h: s(sl.h),
      radius: s(sl.radius),
      gap: s(sl.gap),
      border: sl.border && { ...sl.border, width: s(sl.border.width) },
    })),
    overlays: t.overlays.map((o) => {
      switch (o.type) {
        case "rect":
        case "image":
          return { ...o, x: s(o.x), y: s(o.y), w: s(o.w), h: s(o.h) }
        case "sprockets":
          return { ...o, x: s(o.x), y: s(o.y), w: s(o.w), h: s(o.h), hole: s(o.hole), pitch: s(o.pitch) }
        case "heart":
          return { ...o, x: s(o.x), y: s(o.y), size: s(o.size) }
      }
    }),
    text: t.text.map((tx) => ({ ...tx, x: s(tx.x), y: s(tx.y), size: s(tx.size) })),
    watermark: { ...t.watermark, x: s(t.watermark.x), y: s(t.watermark.y), size: s(t.watermark.size) },
  }
}

export const BUILTIN_TEMPLATES: StripTemplate[] = [
  buildStrip({
    id: "film",
    name: "Film klasik",
    tier: "free",
    paper: "#F4F3EF",
    ink: "#16141D",
    pad: { top: 12, x: 20, bottom: 46 },
    gap: 8,
    cols: 1,
    slotH: 110,
    sprockets: true,
    note: "bareng.",
    noteColor: "#16141D",
  }),
  buildStrip({
    id: "bersih",
    name: "Bersih",
    tier: "free",
    paper: "#FFFFFF",
    ink: "#16141D",
    pad: { top: 16, x: 16, bottom: 44 },
    gap: 6,
    cols: 1,
    slotH: 108,
    slotBorder: { width: 1, color: "#C9C7D1" },
    // Sengaja tanpa catatan: yang tercetak cuma tanggal. Ini template untuk
    // orang yang mau hasilnya bagus, bukan lucu.
    note: "",
    noteColor: "#8A8894",
  }),
  buildStrip({
    id: "wisuda",
    name: "Wisuda",
    tier: "free",
    paper: "#1C2540",
    ink: "#F4F3EF",
    pad: { top: 14, x: 14, bottom: 48 },
    gap: 10,
    cols: 1,
    slotH: 104,
    // Pita emas atas-bawah, seperti selempang. Satu ornamen saja, cukup.
    band: "#D8B45A",
    note: "{{names}} · wisuda",
    previewNote: "wisuda",
    noteColor: "#D8B45A",
  }),
  buildStrip({
    id: "polaroid",
    name: "Polaroid ganda",
    tier: "free",
    paper: "#FFFFFF",
    ink: "#16141D",
    pad: { top: 14, x: 14, bottom: 54 },
    gap: 14,
    cols: 1,
    slotH: 104,
    slotBorder: { width: 8, color: "#FFFFFF" },
    // Nama berdua kalau keduanya mengisi nama panggilan, selain itu "kamu & dia".
    note: "{{names}}",
    noteColor: "#5F5D69",
  }),
  buildStrip({
    id: "kotak",
    name: "Grid kotak",
    tier: "free",
    paper: "#E9E7E1",
    ink: "#16141D",
    pad: { top: 14, x: 14, bottom: 42 },
    gap: 8,
    cols: 2,
    slotH: 84,
    note: "bareng.",
    noteColor: "#5F5D69",
  }),
  buildStrip({
    id: "y2k",
    name: "Y2K neon",
    tier: "premium",
    paper: "#1B1826",
    ink: "#F4F3EF",
    pad: { top: 14, x: 14, bottom: 46 },
    gap: 10,
    cols: 1,
    slotH: 104,
    slotBorder: { width: 2, color: "#FFD23F" },
    band: "#E4462E",
    note: "y2k · 2027",
    noteColor: "#FFD23F",
  }),
  buildStrip({
    id: "kodak",
    name: "Kodak 400",
    tier: "premium",
    paper: "#F1E9DA",
    ink: "#16141D",
    pad: { top: 12, x: 22, bottom: 46 },
    gap: 8,
    cols: 1,
    slotH: 106,
    sprockets: true,
    band: "#E4462E",
    numbers: true,
    note: "400 iso",
    noteColor: "#CC3A25",
  }),
  buildStrip({
    id: "valentine",
    name: "Valentine",
    tier: "premium",
    paper: "#F6E4E1",
    ink: "#16141D",
    pad: { top: 14, x: 14, bottom: 50 },
    gap: 10,
    cols: 1,
    slotH: 104,
    slotBorder: { width: 3, color: "#FFFFFF" },
    hearts: true,
    note: "14.02",
    noteColor: "#CC3A25",
  }),
]

export const DEFAULT_TEMPLATE_ID = "film"

// Dipakai di salinan landing & layar hasil. Diturunkan, bukan ditulis tangan:
// template musiman datang dan pergi, angkanya ikut sendiri.
export const TEMPLATE_COUNT = BUILTIN_TEMPLATES.length
export const FREE_TEMPLATE_COUNT = BUILTIN_TEMPLATES.filter((t) => t.tier === "free").length
export const PREMIUM_TEMPLATE_COUNT = TEMPLATE_COUNT - FREE_TEMPLATE_COUNT

export function getTemplate(id: string | null | undefined): StripTemplate {
  return BUILTIN_TEMPLATES.find((t) => t.id === id) ?? BUILTIN_TEMPLATES[0]
}
