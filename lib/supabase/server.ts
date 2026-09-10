import { createClient } from "@supabase/supabase-js"
import type { Database } from "./types"

// Klien untuk server component (tanpa sesi), mis. halaman publik hasil.
export function supabaseServer() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
