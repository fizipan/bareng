"use client"

// Cloudflare Turnstile: token untuk membuat sesi anonim Supabase, supaya
// pembuatan sesi massal oleh skrip terhalang. Kalau site key belum diisi,
// semua fungsi di sini diam saja dan aplikasi jalan seperti biasa.
// Site key Turnstile memang publik (tampil di HTML), jadi boleh jadi bawaan;
// env dipakai kalau widget-nya diganti. Secret-nya tidak pernah ada di sini —
// itu hanya di Supabase.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "0x4AAAAAAEw2vLZkvV0OJvUJ"
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
// Kalau tantangannya butuh waktu, baru tampilkan kartunya (biasanya langsung lolos).
const SHOW_AFTER_MS = 700
const TIMEOUT_MS = 25_000

type Turnstile = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string | undefined
  remove: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

let loading: Promise<Turnstile | null> | null = null

function load(): Promise<Turnstile | null> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  loading ??= new Promise<Turnstile | null>((resolve) => {
    const el = document.createElement("script")
    el.src = SCRIPT
    el.async = true
    el.onload = () => resolve(window.turnstile ?? null)
    el.onerror = () => resolve(null)
    document.head.appendChild(el)
  }).finally(() => {
    loading = null
  })
  return loading
}

export const captchaEnabled = () => !!SITE_KEY

// Ambil satu token. Mengembalikan undefined kalau captcha tidak aktif atau
// gagal — Supabase yang memutuskan token itu wajib atau tidak.
export async function captchaToken(): Promise<string | undefined> {
  if (!SITE_KEY || typeof window === "undefined") return undefined
  const api = await load()
  if (!api) return undefined

  const overlay = document.createElement("div")
  overlay.className =
    "fixed inset-0 z-[70] hidden place-items-center bg-darkroom/70 p-5 backdrop-blur-[2px] motion-safe:animate-fade-in"
  overlay.innerHTML =
    '<div class="kertas flex max-w-[320px] flex-col items-center gap-3 rounded-md bg-sunken px-5 py-6 text-center text-foreground">' +
    '<span class="text-label font-semibold">Sebentar ya</span>' +
    '<span class="text-small text-muted-foreground">Kami lagi memastikan kamu bukan robot.</span>' +
    '<div data-widget class="min-h-[68px]"></div>' +
    "</div>"
  const widget = overlay.querySelector<HTMLElement>("[data-widget]")!
  document.body.appendChild(overlay)
  const reveal = setTimeout(() => overlay.classList.replace("hidden", "grid"), SHOW_AFTER_MS)

  return new Promise<string | undefined>((resolve) => {
    let id: string | undefined
    let finished = false
    const done = (token?: string) => {
      if (finished) return
      finished = true
      clearTimeout(reveal)
      clearTimeout(timer)
      try {
        if (id) api.remove(id)
      } catch {
        // widget sudah hilang duluan — tidak apa-apa
      }
      overlay.remove()
      resolve(token)
    }
    const timer = setTimeout(() => done(undefined), TIMEOUT_MS)
    try {
      id = api.render(widget, {
        sitekey: SITE_KEY,
        appearance: "interaction-only",
        callback: (token: string) => done(token),
        "error-callback": () => done(undefined),
        "expired-callback": () => done(undefined),
        "timeout-callback": () => done(undefined),
      })
      if (!id) done(undefined)
    } catch {
      done(undefined)
    }
  })
}
