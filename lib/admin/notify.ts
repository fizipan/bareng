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
