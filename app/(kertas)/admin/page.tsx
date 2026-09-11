import type { Metadata } from "next"
import Link from "next/link"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { adminConfigured, isAdmin } from "@/lib/admin/auth"
import { supabaseAdmin } from "@/lib/admin/supabase-admin"
import { cn } from "@/lib/utils"
import { login, logout, resolveReport } from "./actions"
import { ConfirmAction } from "./confirm-action"
import { AdminQueue, type AdminTab, type QueueItem } from "./report-queue"

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } }

// Waktu permintaan (untuk "… menit lalu"); halaman ini selalu dirender per request.
const requestTime = () => Date.now()

// Halaman admin: antrean laporan photostrip. Masuk dengan ADMIN_PASSWORD;
// data dibaca server dengan kunci service_role.
export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const { e, tab } = await searchParams
  const active: AdminTab = tab === "selesai" ? "selesai" : "tinjau"
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
    return shell(
      <section className="flex flex-col gap-3 rounded-md border-[1.5px] border-line p-5">
        <h1 className="font-display text-title font-bold">Admin belum aktif</h1>
        <p className="text-small text-soft-foreground">
          Isi environment variable berikut di Vercel (Project → Settings → Environment Variables), lalu deploy ulang:
        </p>
        <ul className="flex flex-col gap-1.5 font-mono text-meta">
          <li className={cn(adminConfigured() && "text-muted-foreground line-through")}>ADMIN_PASSWORD</li>
          <li className={cn(supabaseAdmin() && "text-muted-foreground line-through")}>SUPABASE_SERVICE_ROLE_KEY</li>
        </ul>
      </section>
    )
  }

  if (!(await isAdmin())) {
    return shell(
      <form action={login} className="mx-auto flex w-full max-w-[360px] flex-col gap-4 rounded-md border-[1.5px] border-line p-5">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-title font-bold">Masuk admin</h1>
          <p className="text-small text-muted-foreground">Untuk meninjau laporan photostrip.</p>
        </div>
        <label className="flex flex-col gap-1.5 text-small font-semibold">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            aria-invalid={e ? true : undefined}
            className="h-12 rounded-md border-[1.5px] border-line bg-sunken px-3.5 text-body font-normal outline-none focus-visible:border-foreground aria-invalid:border-shutter"
          />
        </label>
        {e && (
          <p role="alert" className="text-small text-shutter">
            Password salah.
          </p>
        )}
        <Button type="submit">Masuk</Button>
      </form>
    )
  }

  const { data, error } = await supabaseAdmin()!.rpc("admin_report_queue")
  const queue = (data as QueueItem[] | null) ?? []
  const waiting = queue.filter((q) => q.pending > 0 && !q.removed).length

  return shell(
    <>
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-display-sm font-bold">Laporan</h1>
          <p className="text-small text-muted-foreground">
            {waiting ? `${waiting} photostrip menunggu ditinjau` : "Tidak ada yang perlu ditinjau"}
          </p>
        </div>
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

      {error ? (
        <p className="rounded-md bg-shutter/10 px-4 py-3 text-small text-shutter">Gagal memuat laporan: {error.message}</p>
      ) : (
        <AdminQueue
          queue={queue}
          tab={active}
          action={resolveReport}
          now={requestTime()}
          hrefFor={(t) => (t === "tinjau" ? "/admin" : "/admin?tab=selesai")}
        />
      )}
    </>
  )
}
