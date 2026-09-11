"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { adminPasswordOk, endAdminSession, isAdmin, startAdminSession } from "@/lib/admin/auth"
import { supabaseAdmin } from "@/lib/admin/supabase-admin"

export async function login(form: FormData) {
  if (!adminPasswordOk(String(form.get("password") ?? ""))) {
    // Jeda kecil supaya menebak password berulang jadi lambat.
    await new Promise((r) => setTimeout(r, 800))
    redirect("/admin?e=1")
  }
  await startAdminSession()
  redirect("/admin")
}

export async function logout() {
  await endAdminSession()
  redirect("/admin")
}

// Kiriman Pusat bantuan: tandai selesai / buka lagi.
export async function resolveFeedback(form: FormData) {
  if (!(await isAdmin())) redirect("/admin")
  const id = String(form.get("id") ?? "")
  if (!/^[0-9a-f-]{36}$/.test(id)) return
  const sb = supabaseAdmin()
  if (!sb) return
  await sb.rpc("admin_feedback_resolve", { p_id: id, p_resolved: form.get("resolved") === "1" })
  revalidatePath("/admin")
}

// Tandai laporan photostrip ini sudah ditinjau; "turunkan" = hapus juga.
export async function resolveReport(form: FormData) {
  if (!(await isAdmin())) redirect("/admin")
  const slug = String(form.get("slug") ?? "")
  if (!/^[A-Za-z0-9]{10}$/.test(slug)) return
  const sb = supabaseAdmin()
  if (!sb) return
  await sb.rpc("admin_resolve", { p_slug: slug, p_takedown: form.get("takedown") === "1" })
  revalidatePath("/admin")
}
