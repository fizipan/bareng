"use client"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
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

// Pastikan ada sesi (login anonim otomatis, tanpa form apa pun).
export async function ensureSession() {
  const sb = supabase()
  const { data } = await sb.auth.getSession()
  if (data.session) return data.session
  const { data: created, error } = await sb.auth.signInAnonymously()
  if (error || !created.session) throw error ?? new Error("anonymous_signin_failed")
  return created.session
}
