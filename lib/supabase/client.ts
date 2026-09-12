"use client"

import { captchaEnabled, captchaToken, CaptchaError } from "@/lib/captcha"
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./types"

let client: SupabaseClient<Database> | null = null

// Satu klien per tab. Sesi anonim disimpan di localStorage = identitas
// perangkat (PRD R1: tanpa akun).
export function supabase() {
  if (!client) {
    client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: true, autoRefreshToken: true, storageKey: "bareng-auth" } }
    )
  }
  return client
}

let signingIn: Promise<Session> | null = null

// Pastikan ada sesi (login anonim otomatis, tanpa form apa pun). Panggilan
// bersamaan memakai satu sign-in, supaya satu perangkat = satu user anonim.
export async function ensureSession(): Promise<Session> {
  const sb = supabase()
  const { data } = await sb.auth.getSession()
  if (data.session) return data.session
  // Token captcha (kalau Turnstile dipasang) ikut dikirim: Supabase menolak
  // sesi anonim tanpa token begitu perlindungan captcha dinyalakan.
  signingIn ??= captchaToken()
    .catch(() => undefined)
    .then((captcha) => {
      // Captcha dipasang tapi tokennya tidak didapat (tantangan ditutup atau
      // kelamaan): jangan kirim permintaan yang pasti ditolak.
      if (captchaEnabled() && !captcha) throw new CaptchaError("captcha_failed")
      return sb.auth.signInAnonymously(captcha ? { options: { captchaToken: captcha } } : undefined)
    })
    .then(({ data: created, error }) => {
      if (error || !created.session) throw error ?? new Error("anonymous_signin_failed")
      return created.session
    })
    .finally(() => {
      signingIn = null
    })
  return signingIn
}
