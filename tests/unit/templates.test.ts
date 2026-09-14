import { describe, expect, it } from "vitest"
import {
  BUILTIN_TEMPLATES,
  DEFAULT_TEMPLATE_ID,
  FREE_TEMPLATE_COUNT,
  PREMIUM_TEMPLATE_COUNT,
  TEMPLATE_COUNT,
  getTemplate,
} from "@/lib/templates/builtin"
import { fillTokens, stripTemplateSchema } from "@/lib/templates/schema"

describe("template bawaan", () => {
  // Jumlahnya sengaja tidak dikunci: template musiman datang dan pergi.
  it("id-nya unik, ada yang gratis, dan hitungannya ikut daftar", () => {
    expect(new Set(BUILTIN_TEMPLATES.map((t) => t.id)).size).toBe(BUILTIN_TEMPLATES.length)
    expect(BUILTIN_TEMPLATES.filter((t) => t.tier === "free").length).toBeGreaterThan(0)
    expect(TEMPLATE_COUNT).toBe(BUILTIN_TEMPLATES.length)
    expect(FREE_TEMPLATE_COUNT + PREMIUM_TEMPLATE_COUNT).toBe(TEMPLATE_COUNT)
  })

  it("template bawaan ada dan gratis", () => {
    expect(getTemplate(DEFAULT_TEMPLATE_ID).id).toBe(DEFAULT_TEMPLATE_ID)
    expect(getTemplate(DEFAULT_TEMPLATE_ID).tier).toBe("free")
  })

  it.each(BUILTIN_TEMPLATES.map((t) => [t.id, t] as const))("%s lolos skema JSON", (_, t) => {
    expect(() => stripTemplateSchema.parse(t)).not.toThrow()
  })

  it.each(BUILTIN_TEMPLATES.map((t) => [t.id, t] as const))("%s: slot di dalam kanvas & tidak bertumpuk", (_, t) => {
    const { width, height } = t.canvas
    for (const s of t.slots) {
      expect(s.x).toBeGreaterThanOrEqual(0)
      expect(s.y).toBeGreaterThanOrEqual(0)
      expect(s.x + s.w).toBeLessThanOrEqual(width)
      expect(s.y + s.h).toBeLessThanOrEqual(height)
    }
    for (const a of t.slots)
      for (const b of t.slots) {
        if (a === b) continue
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
        expect(overlap).toBe(false)
      }
  })

  it("lebar kanvas 1060 (strip hasil prototipe ×5)", () => {
    expect(getTemplate("film").canvas).toEqual({ width: 1060, height: 2610 })
  })

  it("id tidak dikenal jatuh ke template default", () => {
    expect(getTemplate("tidak-ada").id).toBe("film")
    expect(getTemplate(null).id).toBe("film")
  })
})

describe("fillTokens", () => {
  it("mengganti {{date}} dan {{host}}", () => {
    expect(fillTokens("{{date}} · {{host}}", { date: "10.09.26", host: "bareng.id" })).toBe("10.09.26 · bareng.id")
  })
  it("membiarkan token lain", () => {
    expect(fillTokens("{{nama}}", { date: "x", host: "y" })).toBe("{{nama}}")
  })
})
