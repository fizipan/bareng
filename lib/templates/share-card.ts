"use client"

import { BRAND } from "@/lib/brand"
import { roundedRect } from "./render"

// Gambar pratinjau link hasil (WhatsApp, IG, X) 1200×630: gaya sama dengan OG
// landing (app/opengraph-image.tsx), strip asli di kanan. JPEG kecil supaya
// pratinjau WhatsApp tetap muncul.

const W = 1200
const H = 630
const PAPER = "#F4F3EF"
const DOT = "#DCD9D1"
const INK = "#16141D"
const SOFT = "#3B3944"
const SHUTTER = "#E4462E"
const FLASH = "#FFD23F"

function fontFamily(variable: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || "sans-serif"
}

// ctx.roundRect belum ada di Safari < 16.
const rounded = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) =>
  roundedRect(ctx, x, y, w, h, [r, r, r, r])

// Pecah judul jadi maks. 2 baris; kecilkan huruf kalau masih kepanjangan.
function fitTitle(ctx: CanvasRenderingContext2D, text: string, family: string, maxWidth: number) {
  for (let size = 76; size >= 46; size -= 4) {
    ctx.font = `800 ${size}px ${family}`
    const lines: string[] = []
    let line = ""
    for (const word of text.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word
      if (ctx.measureText(next).width <= maxWidth || !line) line = next
      else {
        lines.push(line)
        line = word
      }
    }
    if (line) lines.push(line)
    if (lines.length <= 2 && lines.every((l) => ctx.measureText(l).width <= maxWidth)) return { size, lines }
  }
  return { size: 46, lines: [text] }
}

export async function renderShareCard({
  strip,
  title,
  subtitle,
  cta,
}: {
  strip: HTMLCanvasElement
  title: string
  subtitle: string
  cta: string
}): Promise<HTMLCanvasElement> {
  const display = `${fontFamily("--font-bricolage")}, sans-serif`
  const body = `${fontFamily("--font-inter")}, sans-serif`
  await Promise.all(
    [`800 76px ${display}`, `500 28px ${body}`, `500 24px ${body}`].map((f) => document.fonts.load(f).catch(() => []))
  )

  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("no_canvas")

  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = DOT
  for (let y = 11; y < H; y += 22) {
    for (let x = 11; x < W; x += 22) {
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Strip asli di kanan, sedikit miring dengan bayangan.
  const maxH = H - 70
  const maxW = 330
  const scale = Math.min(maxH / strip.height, maxW / strip.width)
  const sw = strip.width * scale
  const sh = strip.height * scale
  ctx.save()
  ctx.translate(W - 80 - sw / 2, H / 2)
  ctx.rotate((4 * Math.PI) / 180)
  ctx.shadowColor = "rgba(22,20,29,0.22)"
  ctx.shadowBlur = 48
  ctx.shadowOffsetY = 24
  ctx.fillStyle = PAPER
  ctx.fillRect(-sw / 2, -sh / 2, sw, sh)
  ctx.shadowColor = "transparent"
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(strip, -sw / 2, -sh / 2, sw, sh)
  ctx.restore()

  // Kolom kiri: logo, judul, tanggal, ajakan.
  const left = 80
  const textMax = W - left - sw - 150
  let y = 96

  ctx.fillStyle = SHUTTER
  rounded(ctx, left, y, 64, 64, 19)
  ctx.fill()
  ctx.fillStyle = PAPER
  rounded(ctx, left + 19, y + 9.5, 26, 45, 4)
  ctx.fill()
  const cell = (45 - 10 - 8) / 3
  ;[INK, FLASH, INK].forEach((c, i) => {
    ctx.fillStyle = c
    rounded(ctx, left + 24, y + 14.5 + i * (cell + 4), 16, cell, 2)
    ctx.fill()
  })
  ctx.font = `800 42px ${display}`
  ctx.textBaseline = "middle"
  ctx.fillStyle = INK
  ctx.fillText(BRAND, left + 82, y + 34)
  ctx.fillStyle = SHUTTER
  ctx.fillText(".", left + 82 + ctx.measureText(BRAND).width, y + 34)

  y += 64 + 56
  const { size, lines } = fitTitle(ctx, title, display, textMax)
  ctx.font = `800 ${size}px ${display}`
  ctx.fillStyle = INK
  ctx.textBaseline = "top"
  for (const line of lines) {
    ctx.fillText(line, left, y)
    y += size * 1.06
  }

  y += 18
  ctx.font = `500 28px ${body}`
  ctx.fillStyle = SOFT
  ctx.fillText(subtitle, left, y)

  y += 28 + 40
  ctx.font = `500 24px ${body}`
  const pillW = 22 + 12 + 12 + ctx.measureText(cta).width + 24
  ctx.fillStyle = "#E9E7E1"
  rounded(ctx, left, y, pillW, 50, 25)
  ctx.fill()
  ctx.fillStyle = SHUTTER
  ctx.beginPath()
  ctx.arc(left + 28, y + 25, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = INK
  ctx.textBaseline = "middle"
  ctx.fillText(cta, left + 46, y + 26)

  return canvas
}
