import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

// Klien server dengan kunci service_role (env SUPABASE_SERVICE_ROLE_KEY):
// hanya untuk /admin & route pembayaran, tidak pernah dikirim ke browser.
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
