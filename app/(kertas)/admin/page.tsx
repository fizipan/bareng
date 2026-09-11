import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeftIcon, SettingsIcon, ShieldCheckIcon } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { adminConfigured, isAdmin } from "@/lib/admin/auth"
import { supabaseAdmin } from "@/lib/admin/supabase-admin"
import { cn } from "@/lib/utils"
import { login, logout, resolveFeedback, resolveReport } from "./actions"
import { ConfirmAction } from "./confirm-action"
import { FeedbackList, type FeedbackItem } from "./feedback-list"
import { LoginForm } from "./login-form"
import { AdminQueue, type AdminTab, type QueueItem } from "./report-queue"

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } }

// Waktu permintaan (untuk "… menit lalu"); halaman ini selalu dirender per request.
const requestTime = () => Date.now()

// Halaman admin: antrean laporan photostrip. Masuk dengan ADMIN_PASSWORD;
// data dibaca server dengan kunci service_role.
export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const { e, tab, view: rawView } = await searchParams
  const active: AdminTab = tab === "selesai" ? "selesai" : "tinjau"
  const view = rawView === "masukan" ? "masukan" : "laporan"
  const shell = (children: React.ReactNode) => (
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 px-5 pt-4 pb-12">
      <header className="flex items-center justify-between gap-3">
        <Link href="/" aria-label="Beranda" className="rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Logo size={26} wordmarkClassName="text-[18px]" />
        </Link>
        <span className="rounded-full bg-card px-3 py-1.5 text-caption font-semibold">Admin</span>
      </header>
      {children}
    </main>
  )

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
  const [reports, feedbackRes] = await Promise.all([sb.rpc("admin_report_queue"), sb.rpc("admin_feedback_list")])
  const queue = (reports.data as QueueItem[] | null) ?? []
  const feedback = (feedbackRes.data as FeedbackItem[] | null) ?? []
  const waiting = queue.filter((q) => q.pending > 0 && !q.removed).length
  const openFeedback = feedback.filter((f) => !f.resolved).length
  const error = view === "masukan" ? feedbackRes.error : reports.error
  const now = requestTime()

  return shell(
    <>
      <div className="flex items-center justify-between gap-3">
        <nav aria-label="Bagian admin" className="flex rounded-full bg-card p-1">
          {(
            [
              ["laporan", "Laporan", waiting, "/admin"],
              ["masukan", "Masukan", openFeedback, "/admin?view=masukan"],
            ] as const
          ).map(([key, label, n, href]) => (
            <Link
              key={key}
              href={href}
              aria-current={view === key ? "page" : undefined}
              className={cn(
                "inline-flex min-h-9 items-center gap-2 rounded-full px-4 text-small font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                view === key ? "bg-background text-foreground shadow-[0_1px_3px_rgb(22_20_29/0.1)]" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
              {n > 0 && <span className="min-w-5 rounded-full bg-shutter px-1.5 text-center text-caption text-kertas tabular-nums">{n}</span>}
            </Link>
          ))}
        </nav>
        <ConfirmAction
          action={logout}
          icon="keluar"
          label="Keluar"
          variant="ghost"
          title="Keluar dari admin?"
          description="Untuk masuk lagi, kamu perlu memasukkan password admin."
          confirmLabel="Keluar"
        />
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="font-display text-display-sm font-bold">{view === "masukan" ? "Masukan" : "Laporan"}</h1>
        <p className="text-small text-muted-foreground">
          {view === "masukan"
            ? openFeedback
              ? `${openFeedback} kiriman belum selesai`
              : "Semua kiriman sudah ditangani"
            : waiting
              ? `${waiting} photostrip menunggu ditinjau`
              : "Tidak ada yang perlu ditinjau"}
        </p>
      </div>

      {error ? (
        <p className="rounded-md bg-shutter/10 px-4 py-3 text-small text-shutter">Gagal memuat data: {error.message}</p>
      ) : view === "masukan" ? (
        <FeedbackList items={feedback} action={resolveFeedback} now={now} />
      ) : (
        <AdminQueue
          queue={queue}
          tab={active}
          action={resolveReport}
          now={now}
          hrefFor={(t) => (t === "tinjau" ? "/admin" : "/admin?tab=selesai")}
        />
      )}
    </>
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
