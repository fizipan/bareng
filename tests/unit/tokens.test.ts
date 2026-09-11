import { describe, expect, it } from "vitest"
import { fillTokens } from "@/lib/templates/tokens"

const base = { date: "11.09.26", host: "bareng.id" }

describe("token template", () => {
  it("tanggal & host", () => expect(fillTokens("{{date}} · {{host}}", base)).toBe("11.09.26 · bareng.id"))
  it("nama bawaan kalau belum diisi", () => {
    expect(fillTokens("{{names}}", base)).toBe("kamu & dia")
    expect(fillTokens("{{names}}", { ...base, names: "  " })).toBe("kamu & dia")
  })
  it("nama berdua", () => expect(fillTokens("{{names}}", { ...base, names: "Rara & Dimas" })).toBe("Rara & Dimas"))
  it("nama panjang dipotong", () => {
    const out = fillTokens("{{names}}", { ...base, names: "Anastasia Kusumawardhani & Bima" })
    expect(out.length).toBeLessThanOrEqual(28)
    expect(out.endsWith("…")).toBe(true)
  })
})
