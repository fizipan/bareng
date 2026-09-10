// Filter CSS (lib/templates/filters.ts) sebagai operasi warna per piksel, supaya
// hasil akhir sama dengan preview live tanpa bergantung pada `ctx.filter`
// (belum ada di Safari lama). Rumus mengikuti spesifikasi Filter Effects;
// hasil tiap fungsi di-clamp ke 0–1 seperti rantai filter di browser.

// Transformasi afine RGB: out = M · rgb + offset (nilai 0–1).
export type ColorOp = { m: [number, number, number, number, number, number, number, number, number]; offset: number }

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

function amountOf(raw: string, fallback = 1) {
  const s = raw.trim()
  if (!s) return fallback
  return s.endsWith("%") ? parseFloat(s) / 100 : parseFloat(s)
}

function angleOf(raw: string) {
  const s = raw.trim()
  const v = parseFloat(s)
  if (s.endsWith("turn")) return v * 2 * Math.PI
  if (s.endsWith("rad")) return v
  if (s.endsWith("grad")) return (v * Math.PI) / 200
  return (v * Math.PI) / 180 // deg (atau tanpa satuan)
}

function grayscale(a: number): ColorOp {
  const k = 1 - clamp01(a)
  return {
    m: [
      0.2126 + 0.7874 * k, 0.7152 - 0.7152 * k, 0.0722 - 0.0722 * k,
      0.2126 - 0.2126 * k, 0.7152 + 0.2848 * k, 0.0722 - 0.0722 * k,
      0.2126 - 0.2126 * k, 0.7152 - 0.7152 * k, 0.0722 + 0.9278 * k,
    ],
    offset: 0,
  }
}

function sepia(a: number): ColorOp {
  const k = 1 - clamp01(a)
  return {
    m: [
      0.393 + 0.607 * k, 0.769 - 0.769 * k, 0.189 - 0.189 * k,
      0.349 - 0.349 * k, 0.686 + 0.314 * k, 0.168 - 0.168 * k,
      0.272 - 0.272 * k, 0.534 - 0.534 * k, 0.131 + 0.869 * k,
    ],
    offset: 0,
  }
}

function saturate(s: number): ColorOp {
  return {
    m: [
      0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s,
      0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s,
      0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s,
    ],
    offset: 0,
  }
}

function hueRotate(rad: number): ColorOp {
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  return {
    m: [
      0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
      0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283,
      0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072,
    ],
    offset: 0,
  }
}

const scale = (k: number, offset = 0): ColorOp => ({ m: [k, 0, 0, 0, k, 0, 0, 0, k], offset })

// "sepia(.35) saturate(.9) contrast(1.05)" → daftar operasi. "none" → [].
export function parseCssFilter(css: string | null | undefined): ColorOp[] {
  if (!css || css === "none") return []
  const ops: ColorOp[] = []
  for (const [, fn, arg] of css.matchAll(/([a-z-]+)\(([^)]*)\)/g)) {
    switch (fn) {
      case "grayscale":
        ops.push(grayscale(amountOf(arg)))
        break
      case "sepia":
        ops.push(sepia(amountOf(arg)))
        break
      case "saturate":
        ops.push(saturate(amountOf(arg)))
        break
      case "hue-rotate":
        ops.push(hueRotate(angleOf(arg || "0")))
        break
      case "contrast": {
        const c = amountOf(arg)
        ops.push(scale(c, 0.5 - 0.5 * c))
        break
      }
      case "brightness":
        ops.push(scale(amountOf(arg)))
        break
    }
  }
  return ops
}

// Terapkan ke data RGBA (Uint8ClampedArray dari getImageData) di tempat.
export function applyColorOps(data: Uint8ClampedArray, ops: ColorOp[]) {
  if (!ops.length) return
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] / 255
    let g = data[i + 1] / 255
    let b = data[i + 2] / 255
    for (const { m, offset } of ops) {
      const nr = m[0] * r + m[1] * g + m[2] * b + offset
      const ng = m[3] * r + m[4] * g + m[5] * b + offset
      const nb = m[6] * r + m[7] * g + m[8] * b + offset
      r = clamp01(nr)
      g = clamp01(ng)
      b = clamp01(nb)
    }
    data[i] = Math.round(r * 255)
    data[i + 1] = Math.round(g * 255)
    data[i + 2] = Math.round(b * 255)
  }
}
