import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeftIcon, SettingsIcon, ShieldCheckIcon } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { adminConfigured, isAdmin } from "@/lib/admin/auth"
import { supabaseAdmin } from "@/lib/admin/supabase-admin"
import { cn } from "@/lib/utils"
import { login, logout, resolveFeedback, resolveReport } from "./actions"
import { AdminView, parseAdminParams } from "./admin-view"
import type { FeedbackItem } from "./feedback-list"
import { LoginForm } from "./login-form"
import type { QueueItem } from "./report-queue"

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } }

// Waktu permintaan (untuk "… menit lalu"); halaman ini selalu dirender per request.
const requestTime = () => Date.now()

// Halaman admin: antrean laporan photostrip. Masuk dengan ADMIN_PASSWORD;
// data dibaca server dengan kunci service_role.
export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams
  const e = sp.e

  if (!adminConfigured() || !supabaseAdmin()) {
    return (
      <Gate icon={<SettingsIcon className="size-5" />} title="Admin belum aktif" subtitle="Isi environment variable berikut, lalu deploy ulang (Vercel) atau muat ulang (lokal).">
        <ul className="flex flex-col divide-y divide-line rounded-md border-[1.5px] border-line font-mono text-meta">
          {(
            [
              ["ADMIN_PASSWORD", adminConfigured()],
              ["SUPABASE_SERVICE_ROLE_KEY", !!supabaseAdmin()],
            ] as const
          ).map(([name, ok]) => (
            <li key={name} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
              {name}
              <span className={cn("font-sans text-caption font-semibold", ok ? "text-ok" : "text-shutter")}>
                {ok ? "terisi" : "belum"}
              </span>
            </li>
          ))}
        </ul>
      </Gate>
    )
  }

  if (!(await isAdmin())) {
    return (
      <Gate icon={<ShieldCheckIcon className="size-5" />} title="Masuk admin" subtitle="Khusus tim Bareng, untuk meninjau laporan photostrip.">
        <LoginForm action={login} error={!!e} />
      </Gate>
    )
  }

  const sb = supabaseAdmin()!
  const params = parseAdminParams(sp)
  const [reports, feedback] = await Promise.all([sb.rpc("admin_report_queue"), sb.rpc("admin_feedback_list")])
  const error = (params.view === "masukan" ? feedback.error : reports.error)?.message ?? null

  return (
    <AdminView
      params={params}
      base="/admin"
      queue={(reports.data as QueueItem[] | null) ?? []}
      feedback={(feedback.data as FeedbackItem[] | null) ?? []}
      error={error}
      now={requestTime()}
      actions={{ resolveReport, resolveFeedback, logout }}
    />
  )
}

// Kartu di tengah layar untuk layar masuk & "belum aktif".
function Gate({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-12">
      <div className="flex w-full max-w-[380px] flex-col gap-6 rounded-md bg-sunken p-6 shadow-[0_1px_2px_rgb(22_20_29/0.06),0_12px_32px_rgb(22_20_29/0.08)] sm:p-7">
        <div className="flex items-center justify-between">
          <Logo size={26} wordmarkClassName="text-[18px]" />
          <span className="rounded-full bg-card px-2.5 py-1 text-caption font-semibold text-soft-foreground">Admin</span>
        </div>
        <div className="flex flex-col gap-3">
          <span aria-hidden className="grid size-11 place-items-center rounded-full bg-darkroom text-kertas">
            {icon}
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-title font-bold">{title}</h1>
            <p className="text-small text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
      <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 text-small text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        <ArrowLeftIcon aria-hidden className="size-4" />
        Kembali ke Bareng
      </Link>
    </main>
  )
}
