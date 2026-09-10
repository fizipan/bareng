"use client"

import { applyColorOps, parseCssFilter } from "./color-filter"
import { fillTokens, type StripOverlay, type StripTemplate, type StripText, type StripTokens } from "./schema"

// Renderer Canvas 2D dari template JSON yang sama dengan preview DOM
// (components/strip/strip.tsx), jadi hasil PNG/JPEG = yang terlihat di layar.
// Lebar hasil: gratis 1080 px, premium 2160 px (PRD R4).

export const FREE_WIDTH = 1080
export const PREMIUM_WIDTH = 2160

export type FrameImage = CanvasImageSource & { width: number; height: number }
export type StripImages = { a: FrameImage; b: FrameImage }[]

type Fonts = Record<StripText["font"], string>

// Keluarga font dari next/font (variabel CSS di <html>), sama dengan DOM.
function resolveFonts(): Fonts {
  const css = getComputedStyle(document.documentElement)
  const family = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
  return {
    display: `${family("--font-bricolage", "sans-serif")}, ${family("--font-inter", "sans-serif")}, sans-serif`,
    sans: `${family("--font-inter", "sans-serif")}, sans-serif`,
    mono: "ui-monospace, Menlo, monospace",
  }
}

const fontSpec = (fonts: Fonts, t: Pick<StripText, "font" | "weight" | "size">, k: number) =>
  `${t.weight} ${t.size * k}px ${fonts[t.font]}`

// Radius sudut ala CSS: kalau jumlah dua radius bersebelahan melebihi sisi,
// semua radius diperkecil dengan faktor yang sama.
export function cssRadii(w: number, h: number, [tl, tr, br, bl]: [number, number, number, number]) {
  const f = Math.min(1, w / (tl + tr), h / (tr + br), w / (br + bl), h / (bl + tl))
  return [tl * f, tr * f, br * f, bl * f] as [number, number, number, number]
}

export function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: [number, number, number, number]) {
  const [tl, tr, br, bl] = r
  ctx.beginPath()
  ctx.moveTo(x + tl, y)
  ctx.lineTo(x + w - tr, y)
  ctx.arcTo(x + w, y, x + w, y + tr, tr)
  ctx.lineTo(x + w, y + h - br)
  ctx.arcTo(x + w, y + h, x + w - br, y + h, br)
  ctx.lineTo(x + bl, y + h)
  ctx.arcTo(x, y + h, x, y + h - bl, bl)
  ctx.lineTo(x, y + tl)
  ctx.arcTo(x, y, x + tl, y, tl)
  ctx.closePath()
}

function drawOverlay(ctx: CanvasRenderingContext2D, o: StripOverlay, k: number, images: Map<string, FrameImage>) {
  switch (o.type) {
    case "rect":
      ctx.fillStyle = o.color
      ctx.fillRect(o.x * k, o.y * k, o.w * k, o.h * k)
      return
    case "sprockets": {
      // Sama dengan repeating-linear-gradient: lubang `hole` tiap `pitch`.
      ctx.fillStyle = o.color
      for (let y = 0; y < o.h; y += o.pitch) {
        ctx.fillRect(o.x * k, (o.y + y) * k, o.w * k, Math.min(o.hole, o.h - y) * k)
      }
      return
    }
    case "heart": {
      const s = o.size * k
      ctx.save()
      ctx.translate(o.x * k + s / 2, o.y * k + s / 2)
      ctx.rotate(Math.PI / 4)
      ctx.fillStyle = o.color
      roundedRect(ctx, -s / 2, -s / 2, s, s, cssRadii(s, s, [9999, 9999, s * 0.22, 9999]))
      ctx.fill()
      ctx.restore()
      return
    }
    case "image": {
      const img = images.get(o.src)
      if (img) ctx.drawImage(img, o.x * k, o.y * k, o.w * k, o.h * k)
      return
    }
  }
}

// Teks dengan line-height 1 seperti DOM: baseline dihitung dari metrik font.
function drawText(ctx: CanvasRenderingContext2D, t: StripText, value: string, fonts: Fonts, k: number) {
  ctx.font = fontSpec(fonts, t, k)
  ctx.fillStyle = t.color
  ctx.textAlign = t.align
  ctx.textBaseline = "alphabetic"
  const size = t.size * k
  const m = ctx.measureText(value)
  const shift = (m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2
  const y = t.baseline === "bottom" ? t.y * k - size / 2 + shift : t.y * k + shift
  ctx.fillText(value, t.x * k, y)
}

// Isi setengah slot: crop "cover" di tengah + filter warna.
function drawHalf(
  ctx: CanvasRenderingContext2D,
  img: FrameImage,
  x: number,
  y: number,
  w: number,
  h: number,
  filterCss: string | null
) {
  const dw = Math.round(w)
  const dh = Math.round(h)
  if (dw <= 0 || dh <= 0) return
  const scale = Math.max(dw / img.width, dh / img.height)
  const sw = dw / scale
  const sh = dh / scale
  const sx = (img.width - sw) / 2
  const sy = (img.height - sh) / 2
  const ops = parseCssFilter(filterCss)
  if (!ops.length) {
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
    return
  }
  const tmp = document.createElement("canvas")
  tmp.width = dw
  tmp.height = dh
  const tctx = tmp.getContext("2d", { willReadFrequently: true })
  if (!tctx) return
  tctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh)
  const data = tctx.getImageData(0, 0, dw, dh)
  applyColorOps(data.data, ops)
  tctx.putImageData(data, 0, 0)
  ctx.drawImage(tmp, x, y, w, h)
}

export async function renderStrip({
  template,
  images,
  filterCss,
  tokens,
  watermark,
  width,
}: {
  template: StripTemplate
  images: StripImages
  filterCss: string | null
  tokens: StripTokens
  watermark: boolean
  width: number
}): Promise<HTMLCanvasElement> {
  const k = width / template.canvas.width
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(template.canvas.width * k)
  canvas.height = Math.round(template.canvas.height * k)
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("no_canvas")
  ctx.imageSmoothingQuality = "high"

  const fonts = resolveFonts()
  const texts = [...template.text]
  if (watermark) {
    texts.push({
      key: "watermark",
      x: template.watermark.x,
      y: template.watermark.y,
      baseline: "bottom",
      align: "right",
      size: template.watermark.size,
      font: "sans",
      weight: 400,
      color: template.watermark.color,
      value: "{{host}}",
    })
  }
  // Pastikan font sudah termuat sebelum menggambar teks.
  await Promise.all(texts.map((t) => document.fonts.load(fontSpec(fonts, t, k)).catch(() => [])))

  const overlayImages = new Map<string, FrameImage>()
  await Promise.all(
    template.overlays
      .filter((o): o is Extract<StripOverlay, { type: "image" }> => o.type === "image")
      .map(async (o) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = o.src
        await img.decode().catch(() => {})
        overlayImages.set(o.src, img)
      })
  )

  ctx.fillStyle = template.background.value
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (const o of template.overlays) drawOverlay(ctx, o, k, overlayImages)

  for (const slot of template.slots) {
    const x = slot.x * k
    const y = slot.y * k
    const w = slot.w * k
    const h = slot.h * k
    const r = slot.radius * k
    const radii = cssRadii(w, h, [r, r, r, r])
    ctx.save()
    if (r > 0) {
      roundedRect(ctx, x, y, w, h, radii)
      ctx.clip()
    }
    // box-sizing: border-box — latar di bawah border, isi di dalam border.
    ctx.fillStyle = slot.background
    ctx.fillRect(x, y, w, h)
    const bw = slot.border ? slot.border.width * k : 0
    if (slot.border) {
      ctx.fillStyle = slot.border.color
      ctx.fillRect(x, y, w, bw)
      ctx.fillRect(x, y + h - bw, w, bw)
      ctx.fillRect(x, y, bw, h)
      ctx.fillRect(x + w - bw, y, bw, h)
    }
    const gap = slot.gap * k
    const innerW = w - 2 * bw
    const innerH = h - 2 * bw
    const halfW = (innerW - gap) / 2
    const pair = images[slot.index]
    if (pair) {
      drawHalf(ctx, pair.a, x + bw, y + bw, halfW, innerH, filterCss)
      drawHalf(ctx, pair.b, x + bw + halfW + gap, y + bw, halfW, innerH, filterCss)
    }
    ctx.restore()
  }

  for (const t of texts) drawText(ctx, t, fillTokens(t.value, tokens), fonts, k)
  return canvas
}

export function canvasToJpeg(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode_failed"))), "image/jpeg", quality)
  )
}
