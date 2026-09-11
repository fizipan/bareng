import { SITE_URL } from "@/lib/brand"
import { reasonLabel } from "@/lib/content/report-reasons"

// Email ke admin saat ada laporan (Resend). Env: RESEND_API_KEY, ADMIN_EMAIL,
// REPORT_EMAIL_FROM (opsional; tanpa domain terverifikasi pakai
// onboarding@resend.dev, yang hanya bisa mengirim ke email pemilik akun Resend).

// Kirim hanya di laporan ke-1, 3, 10, 25, 50 per photostrip supaya tidak dibanjiri.
export const NOTIFY_AT = new Set([1, 3, 10, 25, 50])

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

export async function emailReport(input: {
  slug: string
  reason: string | null
  note: string | null
  reports: number
  names: string | null
}) {
  const key = process.env.RESEND_API_KEY
  const to = process.env.ADMIN_EMAIL
  if (!key || !to) {
    console.warn("[laporan] RESEND_API_KEY / ADMIN_EMAIL belum di-set, email tidak dikirim")
    return
  }
  const label = reasonLabel(input.reason)
  const page = `${SITE_URL}/p/${input.slug}`
  const title = input.names ? escape(input.names) : "Photostrip berdua"
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.REPORT_EMAIL_FROM ?? "Bareng <onboarding@resend.dev>",
      to: [to],
      subject: `Laporan baru: ${label} (${input.reports}×)`,
      html: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#16141D">
<p style="font-size:18px;font-weight:700;margin:0 0 12px">Ada laporan di Bareng</p>
<p style="margin:0 0 4px">Photostrip: <a href="${page}">${title}</a> <span style="color:#5F5D69">(${input.slug})</span></p>
<p style="margin:0 0 4px">Alasan terbaru: <b>${escape(label)}</b></p>
${input.note ? `<p style="margin:0 0 4px;padding:10px 12px;background:#E9E7E1;border-radius:8px">“${escape(input.note)}”</p>` : ""}
<p style="margin:0 0 16px">Total laporan: <b>${input.reports}</b></p>
<p style="margin:0"><a href="${SITE_URL}/admin" style="display:inline-block;background:#E4462E;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Tinjau di halaman admin</a></p>
</div>`,
    }),
  })
  if (!res.ok) console.error("[laporan] email gagal", res.status, await res.text().catch(() => ""))
}

// Email ke admin untuk kiriman Pusat bantuan; reply-to = email pengirim
// (kalau diisi) supaya tinggal klik balas.
export async function emailFeedback(input: {
  kind: string
  message: string
  email: string | null
  roomCode: string | null
  page: string | null
  userAgent: string | null
  device?: string | null
}) {
  const key = process.env.RESEND_API_KEY
  const to = process.env.ADMIN_EMAIL
  if (!key || !to) {
    console.warn("[bantuan] RESEND_API_KEY / ADMIN_EMAIL belum di-set, email tidak dikirim")
    return
  }
  const { feedbackLabel } = await import("@/lib/content/feedback")
  const label = feedbackLabel(input.kind)
  const meta = [
    input.email && `Email: <a href="mailto:${escape(input.email)}">${escape(input.email)}</a>`,
    input.roomCode && `Kode room: <b>${escape(input.roomCode)}</b>`,
    input.page && `Halaman: ${escape(input.page)}`,
    input.device && `Perangkat: ${escape(input.device)}`,
    input.userAgent && `<span style="color:#5F5D69">${escape(input.userAgent)}</span>`,
  ].filter(Boolean)
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.REPORT_EMAIL_FROM ?? "Bareng <onboarding@resend.dev>",
      to: [to],
      ...(input.email ? { reply_to: input.email } : {}),
      subject: `[${label}] ${input.message.slice(0, 60)}${input.message.length > 60 ? "…" : ""}`,
      html: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#16141D">
<p style="font-size:18px;font-weight:700;margin:0 0 12px">${escape(label)} dari Pusat bantuan</p>
<p style="margin:0 0 14px;padding:12px 14px;background:#E9E7E1;border-radius:10px;white-space:pre-wrap">${escape(input.message)}</p>
<p style="margin:0 0 16px;font-size:13px">${meta.join("<br>")}</p>
<p style="margin:0"><a href="${SITE_URL}/admin?view=masukan" style="display:inline-block;background:#16141D;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Buka di halaman admin</a></p>
</div>`,
    }),
  })
  if (!res.ok) console.error("[bantuan] email gagal", res.status, await res.text().catch(() => ""))
}
