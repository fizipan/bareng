import { describe, expect, it } from "vitest"
import { formatLongDate, formatStripDate } from "@/lib/format"
import { makeRoomCode } from "@/stores/session"

describe("kode room", () => {
  it("6 karakter dari alfabet tanpa huruf/angka yang mirip (I, O, 0, 1)", () => {
    for (let i = 0; i < 500; i++) {
      expect(makeRoomCode()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
    }
  })
  it("cukup acak", () => {
    const codes = new Set(Array.from({ length: 1000 }, makeRoomCode))
    expect(codes.size).toBeGreaterThan(990)
  })
})

describe("format tanggal", () => {
  const d = new Date(2026, 8, 10, 21, 4)
  it("strip: dd.mm.yy", () => expect(formatStripDate(d)).toBe("10.09.26"))
  it("panjang: bahasa Indonesia", () => expect(formatLongDate(d)).toBe("10 September 2026"))
})
