import Link from "next/link"
import { FlagIcon, MessageSquareIcon } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { FEEDBACK_KINDS, feedbackLabel } from "@/lib/content/feedback"
import { cn } from "@/lib/utils"
import { ConfirmAction } from "./confirm-action"
import { FeedbackList, KIND_STYLE, type FeedbackItem } from "./feedback-list"
import { HistoryList, needsReview, ReviewList, type QueueItem } from "./report-queue"

export type AdminParams = { view: "laporan" | "masukan"; status: "aktif" | "selesai"; kind: string | null }

type Actions = {
  resolveReport: (form: FormData) => Promise<void>
  resolveFeedback: (form: FormData) => Promise<void>
  logout: (form: FormData) => Promise<void>
}

export function parseAdminParams(sp: Record<string, string | string[] | undefined>): AdminParams {
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : null)
  const kind = one(sp.jenis)
  return {
    view: one(sp.view) === "masukan" ? "masukan" : "laporan",
    status: one(sp.status) === "selesai" ? "selesai" : "aktif",
    kind: FEEDBACK_KINDS.some((k) => k.id === kind) ? kind : null,
  }
}

// Kerangka admin: sidebar (layar lebar) / navigasi atas (HP) untuk Laporan &
// Masukan, judul, tab status bergaris bawah, dan daftar. Dipakai /admin dan
// pratinjau /dev/admin (data contoh).
export function AdminView({
  params,
  base,
  queue,
  feedback,
  error,
  now,
  actions,
}: {
  params: AdminParams
  base: string
  queue: QueueItem[]
  feedback: FeedbackItem[]
  error: string | null
  now: number
  actions: Actions
}) {
  const href = (p: Partial<AdminParams>) => {
    const next = { ...params, ...p }
    const q = new URLSearchParams()
    if (next.view === "masukan") q.set("view", "masukan")
    if (next.status === "selesai") q.set("status", "selesai")
    if (next.view === "masukan" && next.kind) q.set("jenis", next.kind)
    const s = q.toString()
    return s ? `${base}?${s}` : base
  }

  const reportsOpen = queue.filter(needsReview)
  const reportsDone = queue.filter((q) => !needsReview(q))
  const feedbackOpen = feedback.filter((f) => !f.resolved)
  const feedbackDone = feedback.filter((f) => f.resolved)
  const sections = [
    { key: "laporan", label: "Laporan", icon: FlagIcon, count: reportsOpen.length },
    { key: "masukan", label: "Masukan", icon: MessageSquareIcon, count: feedbackOpen.length },
  ] as const

  const isReports = params.view === "laporan"
  const openCount = isReports ? reportsOpen.length : feedbackOpen.length
  const doneCount = isReports ? reportsDone.length : feedbackDone.length
  const feedbackInStatus = params.status === "selesai" ? feedbackDone : feedbackOpen
  const feedbackShown = params.kind ? feedbackInStatus.filter((f) => f.kind === params.kind) : feedbackInStatus

  const logout = (
    <ConfirmAction
      action={actions.logout}
      icon="keluar"
      label="Keluar"
      variant="ghost"
      title="Keluar dari admin?"
      description="Untuk masuk lagi, kamu perlu memasukkan password admin."
      confirmLabel="Keluar"
    />
  )

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-1 gap-10 px-5 lg:px-8">
      {/* Sidebar: layar lebar */}
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-8 py-8 lg:flex">
        <div className="flex items-center gap-2.5">
          <Logo size={26} wordmarkClassName="text-[18px]" />
          <span className="rounded-full bg-card px-2 py-0.5 text-caption font-semibold text-soft-foreground">Admin</span>
        </div>
        <nav aria-label="Bagian admin" className="flex flex-col gap-1">
          {sections.map(({ key, label, icon: Icon, count }) => (
            <Link
              key={key}
              href={href({ view: key, status: "aktif", kind: null })}
              aria-current={params.view === key ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 text-small font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                params.view === key ? "bg-card text-foreground" : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
              )}
            >
              <Icon aria-hidden className="size-[18px]" />
              {label}
              {count > 0 && (
                <span className="ml-auto min-w-6 rounded-full bg-shutter px-1.5 py-0.5 text-center text-caption leading-none text-kertas tabular-nums">
                  {count}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">{logout}</div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-6 py-5 lg:py-10">
        {/* Atas: HP */}
        <div className="flex flex-col gap-4 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Logo size={26} wordmarkClassName="text-[18px]" />
              <span className="rounded-full bg-card px-2 py-0.5 text-caption font-semibold text-soft-foreground">Admin</span>
            </div>
            {logout}
          </div>
          <nav aria-label="Bagian admin" className="grid grid-cols-2 rounded-full bg-card p-1">
            {sections.map(({ key, label, icon: Icon, count }) => (
              <Link
                key={key}
                href={href({ view: key, status: "aktif", kind: null })}
                aria-current={params.view === key ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full text-small font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  params.view === key ? "bg-background text-foreground shadow-[0_1px_3px_rgb(22_20_29/0.1)]" : "text-muted-foreground"
                )}
              >
                <Icon aria-hidden className="size-4" />
                {label}
                {count > 0 && (
                  <span className="min-w-5 rounded-full bg-shutter px-1.5 text-center text-caption text-kertas tabular-nums">{count}</span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        <header className="flex flex-col gap-1">
          <h1 className="font-display text-display-sm font-bold lg:text-display-md">{isReports ? "Laporan photostrip" : "Masukan & bug"}</h1>
          <p className="text-small text-muted-foreground">
            {isReports
              ? "Photostrip yang dilaporkan pengunjung halaman publik."
              : "Kiriman dari Pusat bantuan & tombol bantuan melayang."}
          </p>
        </header>

        {/* Tab status bergaris bawah (beda gaya dari navigasi bagian). */}
        <nav aria-label="Status" className="flex gap-6 border-b-[1.5px] border-line">
          {(
            [
              ["aktif", isReports ? "Perlu ditinjau" : "Belum selesai", openCount],
              ["selesai", "Selesai", doneCount],
            ] as const
          ).map(([key, label, n]) => (
            <Link
              key={key}
              href={href({ status: key })}
              aria-current={params.status === key ? "page" : undefined}
              className={cn(
                "-mb-[1.5px] inline-flex min-h-11 items-center gap-2 border-b-2 text-small font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                params.status === key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
              <span
                className={cn(
                  "min-w-5 rounded-full px-1.5 text-center text-caption tabular-nums",
                  key === "aktif" && n > 0 ? "bg-shutter/12 text-shutter" : "bg-card text-soft-foreground"
                )}
              >
                {n}
              </span>
            </Link>
          ))}
        </nav>

        {!isReports && (
          <div className="-mt-2 flex flex-wrap gap-2">
            {[null, ...FEEDBACK_KINDS.map((k) => k.id)].map((id) => {
              const n = id ? feedbackInStatus.filter((f) => f.kind === id).length : feedbackInStatus.length
              const style = id ? KIND_STYLE[id as keyof typeof KIND_STYLE] : null
              const Icon = style?.icon
              const on = params.kind === id
              return (
                <Link
                  key={id ?? "semua"}
                  href={href({ kind: id })}
                  aria-current={on ? "true" : undefined}
                  className={cn(
                    "inline-flex min-h-9 items-center gap-1.5 rounded-full border-[1.5px] px-3 text-caption font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    on ? "border-foreground bg-foreground text-background" : "border-line text-soft-foreground hover:border-line-strong"
                  )}
                >
                  {Icon && <Icon aria-hidden className="size-3.5" />}
                  {id ? feedbackLabel(id) : "Semua"}
                  <span className={cn("tabular-nums", on ? "text-background/70" : "text-muted-foreground")}>{n}</span>
                </Link>
              )
            })}
          </div>
        )}

        {error ? (
          <p className="rounded-md bg-shutter/10 px-4 py-3 text-small text-shutter">Gagal memuat data: {error}</p>
        ) : isReports ? (
          params.status === "selesai" ? (
            <HistoryList items={reportsDone} now={now} />
          ) : (
            <ReviewList items={reportsOpen} action={actions.resolveReport} now={now} />
          )
        ) : (
          <FeedbackList
            items={feedbackShown}
            action={actions.resolveFeedback}
            now={now}
            emptyText={params.status === "selesai" ? "Belum ada yang ditandai selesai." : "Belum ada kiriman baru. Aman!"}
          />
        )}
      </main>
    </div>
  )
}
