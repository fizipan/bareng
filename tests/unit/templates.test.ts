import { describe, expect, it } from "vitest"
import { BUILTIN_TEMPLATES, getTemplate } from "@/lib/templates/builtin"
import { fillTokens, stripTemplateSchema } from "@/lib/templates/schema"

describe("template bawaan", () => {
  it("ada 6 template: 3 gratis, 3 premium", () => {
    expect(BUILTIN_TEMPLATES).toHaveLength(6)
    expect(BUILTIN_TEMPLATES.filter((t) => t.tier === "free")).toHaveLength(3)
    expect(new Set(BUILTIN_TEMPLATES.map((t) => t.id)).size).toBe(6)
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
