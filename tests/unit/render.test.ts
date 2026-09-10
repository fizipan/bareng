import { describe, expect, it } from "vitest"
import { applyColorOps, parseCssFilter } from "@/lib/templates/color-filter"
import { FILTERS } from "@/lib/templates/filters"
import { cssRadii } from "@/lib/templates/render"

const px = (...rgb: number[]) => new Uint8ClampedArray([...rgb, 255])
const run = (css: string, data: Uint8ClampedArray) => {
  applyColorOps(data, parseCssFilter(css))
  return [...data.slice(0, 3)]
}

describe("filter warna (setara CSS filter)", () => {
  it("none → tanpa operasi", () => {
    expect(parseCssFilter("none")).toEqual([])
    expect(run("none", px(10, 20, 30))).toEqual([10, 20, 30])
  })
  it("grayscale(1): luminans sRGB", () => {
    expect(run("grayscale(1)", px(255, 0, 0))).toEqual([54, 54, 54])
  })
  it("sepia(1) di putih: tiap langkah di-clamp", () => {
    expect(run("sepia(1)", px(255, 255, 255))).toEqual([255, 255, 239])
  })
  it("contrast(0) → abu tengah; hue-rotate 360deg ≈ tetap", () => {
    expect(run("contrast(0)", px(10, 200, 90))).toEqual([128, 128, 128])
    const same = run("hue-rotate(360deg)", px(200, 100, 50))
    same.forEach((v, i) => expect(Math.abs(v - [200, 100, 50][i])).toBeLessThanOrEqual(1))
  })
  it("semua filter template bisa diparse", () => {
    for (const f of FILTERS) expect(parseCssFilter(f.css).length).toBe(f.css.match(/\(/g)?.length ?? 0)
  })
})

describe("cssRadii", () => {
  it("radius kebesaran diperkecil serentak seperti CSS (hati: ujung bawah jadi lancip)", () => {
    const [tl, tr, br, bl] = cssRadii(10, 10, [9999, 9999, 2.2, 9999])
    expect(tl).toBeCloseTo(5, 3)
    expect(tr).toBeCloseTo(5, 3)
    expect(bl).toBeCloseTo(5, 3)
    expect(br).toBeLessThan(0.01)
  })
  it("radius kecil tidak berubah", () => {
    expect(cssRadii(100, 50, [4, 4, 4, 4])).toEqual([4, 4, 4, 4])
  })
})
