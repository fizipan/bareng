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

// Perangkat demo: sesi anonim browser ini (token dari komponen klien)
// didaftarkan → room buatannya premium, tanpa batas harian.
export async function enableDemoDevice(token: string, label: string) {
  if (!(await isAdmin())) redirect("/admin")
  const sb = supabaseAdmin()
  if (!sb || typeof token !== "string" || !token) return { ok: false }
  const { data } = await sb.auth.getUser(token)
  if (!data.user) return { ok: false }
  const { error } = await sb.rpc("admin_demo_set", { p_user: data.user.id, p_label: String(label ?? "").slice(0, 80), p_on: true })
  revalidatePath("/admin")
  return { ok: !error }
}

// Setujui / tolak permintaan akses demo dari halaman /demo.
export async function decideDemoRequest(form: FormData) {
  if (!(await isAdmin())) redirect("/admin")
  const id = String(form.get("id") ?? "")
  if (!/^[0-9a-f-]{36}$/.test(id)) return
  const sb = supabaseAdmin()
  if (!sb) return
  const hari = String(form.get("hari") ?? "")
  await sb.rpc("admin_demo_decide", {
    p_id: id,
    p_approve: form.get("approve") === "1",
    p_days: /^\d{1,3}$/.test(hari) ? Number(hari) : null,
  })
  revalidatePath("/admin")
}

export async function revokeDemoDevice(form: FormData) {
  if (!(await isAdmin())) redirect("/admin")
  const id = String(form.get("user") ?? "")
  if (!/^[0-9a-f-]{36}$/.test(id)) return
  const sb = supabaseAdmin()
  if (!sb) return
  await sb.rpc("admin_demo_set", { p_user: id, p_label: "", p_on: false })
  revalidatePath("/admin")
}
