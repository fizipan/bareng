import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

// Login admin: satu password dari env ADMIN_PASSWORD. Cookie berisi masa
// berlaku + HMAC (kunci = password), jadi ganti password = semua sesi keluar.
const COOKIE = "bareng_admin"
const MAX_AGE_S = 60 * 60 * 24 * 7

export const adminConfigured = () => !!process.env.ADMIN_PASSWORD

const sign = (expires: number) =>
  createHmac("sha256", process.env.ADMIN_PASSWORD ?? "").update(`admin:${expires}`).digest("base64url")

export function makeAdminToken(now = Date.now()) {
  const expires = now + MAX_AGE_S * 1000
  return `${expires}.${sign(expires)}`
}

export function verifyAdminToken(token: string | undefined, now = Date.now()) {
  if (!token || !adminConfigured()) return false
  const [raw, sig] = token.split(".")
  const expires = Number(raw)
  if (!expires || expires < now || !sig) return false
  const want = Buffer.from(sign(expires))
  const got = Buffer.from(sig)
  return want.length === got.length && timingSafeEqual(want, got)
}

export function adminPasswordOk(input: string) {
  if (!adminConfigured()) return false
  const a = createHash("sha256").update(input).digest()
  const b = createHash("sha256").update(process.env.ADMIN_PASSWORD!).digest()
  return timingSafeEqual(a, b)
}

export async function isAdmin() {
  return verifyAdminToken((await cookies()).get(COOKIE)?.value)
}

export async function startAdminSession() {
  ;(await cookies()).set(COOKIE, makeAdminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: MAX_AGE_S,
  })
}

export async function endAdminSession() {
  ;(await cookies()).delete({ name: COOKIE, path: "/admin" })
}
