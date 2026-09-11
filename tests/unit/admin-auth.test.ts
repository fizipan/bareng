import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { adminPasswordOk, makeAdminToken, verifyAdminToken } from "@/lib/admin/auth"

describe("token admin", () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = "rahasia-uji"
  })
  afterEach(() => {
    delete process.env.ADMIN_PASSWORD
  })

  it("token baru valid", () => expect(verifyAdminToken(makeAdminToken())).toBe(true))

  it("kedaluwarsa setelah 7 hari", () => {
    const t = makeAdminToken(0)
    expect(verifyAdminToken(t, 7 * 24 * 3_600_000 - 1)).toBe(true)
    expect(verifyAdminToken(t, 7 * 24 * 3_600_000 + 1)).toBe(false)
  })

  it("tanda tangan dipalsukan / diganti masa berlaku ditolak", () => {
    const [exp, sig] = makeAdminToken().split(".")
    expect(verifyAdminToken(`${exp}.${sig.slice(0, -2)}xx`)).toBe(false)
    expect(verifyAdminToken(`${Number(exp) + 1000}.${sig}`)).toBe(false)
    expect(verifyAdminToken("")).toBe(false)
    expect(verifyAdminToken(undefined)).toBe(false)
  })

  it("ganti password = token lama tidak berlaku", () => {
    const t = makeAdminToken()
    process.env.ADMIN_PASSWORD = "password-baru"
    expect(verifyAdminToken(t)).toBe(false)
  })

  it("cek password", () => {
    expect(adminPasswordOk("rahasia-uji")).toBe(true)
    expect(adminPasswordOk("salah")).toBe(false)
    delete process.env.ADMIN_PASSWORD
    expect(adminPasswordOk("")).toBe(false)
  })
})
