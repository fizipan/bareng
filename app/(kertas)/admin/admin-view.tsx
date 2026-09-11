import Link from "next/link"
import { ChartNoAxesColumnIcon, FlagIcon, MessageSquareIcon, PresentationIcon } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { FEEDBACK_KINDS, feedbackLabel } from "@/lib/content/feedback"
import { cn } from "@/lib/utils"
import { ConfirmAction } from "./confirm-action"
import { DemoView, type DemoDevice } from "./demo-view"
import { FeedbackList, KIND_STYLE, type FeedbackItem } from "./feedback-list"
import { HistoryList, needsReview, ReviewList, type QueueItem } from "./report-queue"
import { StatsView, type AdminStats } from "./stats-view"

const VIEWS = ["laporan", "masukan", "statistik", "demo"] as const
const PERIODS = [7, 30, 90] as const

export type AdminParams = {
  view: (typeof VIEWS)[number]
  status: "aktif" | "selesai"
  kind: string | null
  days: (typeof PERIODS)[number]
}

type Actions = {
  resolveReport: (form: FormData) => Promise<void>
  resolveFeedback: (form: FormData) => Promise<void>
  logout: (form: FormData) => Promise<void>
  enableDemo: (token: string, label: string) => Promise<{ ok: boolean }>
  revokeDemo: (form: FormData) => Promise<void>
}

const HEADER: Record<AdminParams["view"], [string, string]> = {
  laporan: ["Laporan photostrip", "Photostrip yang dilaporkan pengunjung halaman publik."],
  masukan: ["Masukan & bug", "Kiriman dari Pusat bantuan & tombol bantuan melayang."],
  statistik: ["Statistik", "Catatan teknis dari sesi sungguhan, tanpa data pribadi."],
  demo: ["Perangkat demo", "Foto tanpa batas dan langsung premium, untuk kamu pakai sendiri atau demo ke customer."],
}

export function parseAdminParams(sp: Record<string, string | string[] | undefined>): AdminParams {
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : null)
  const kind = one(sp.jenis)
  const view = VIEWS.find((v) => v === one(sp.view)) ?? "laporan"
  const days = PERIODS.find((d) => String(d) === one(sp.hari)) ?? 7
  return {
    view,
    status: one(sp.status) === "selesai" ? "selesai" : "aktif",
    kind: FEEDBACK_KINDS.some((k) => k.id === kind) ? kind : null,
    days,
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
  stats,
  demo,
  deviceLabel,
  error,
  now,
  actions,
}: {
  params: AdminParams
  base: string
  queue: QueueItem[]
  feedback: FeedbackItem[]
  stats: AdminStats | null
  demo: DemoDevice[]
  deviceLabel: string
  error: string | null
  now: number
  actions: Actions
}) {
  const href = (p: Partial<AdminParams>) => {
    const next = { ...params, ...p }
    const q = new URLSearchParams()
    if (next.view !== "laporan") q.set("view", next.view)
    if (next.status === "selesai" && (next.view === "laporan" || next.view === "masukan")) q.set("status", "selesai")
    if (next.view === "masukan" && next.kind) q.set("jenis", next.kind)
    if (next.view === "statistik" && next.days !== 7) q.set("hari", String(next.days))
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
    { key: "statistik", label: "Statistik", icon: ChartNoAxesColumnIcon, count: 0 },
    { key: "demo", label: "Demo", icon: PresentationIcon, count: 0 },
  ] as const

  const isReports = params.view === "laporan"
  const isInbox = params.view === "laporan" || params.view === "masukan"
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
          <nav aria-label="Bagian admin" className="grid grid-cols-4 gap-1 rounded-md bg-card p-1">
            {sections.map(({ key, label, icon: Icon, count }) => (
              <Link
                key={key}
                href={href({ view: key, status: "aktif", kind: null })}
                aria-current={params.view === key ? "page" : undefined}
                className={cn(
                  "relative flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-sm text-caption font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  params.view === key ? "bg-background text-foreground shadow-[0_1px_3px_rgb(22_20_29/0.1)]" : "text-muted-foreground"
                )}
              >
                <Icon aria-hidden className="size-[18px]" />
                {label}
                {count > 0 && (
                  <span className="absolute top-1 right-1.5 min-w-4.5 rounded-full bg-shutter px-1 text-center text-[10px] leading-4 text-kertas tabular-nums">
                    {count}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        <header className="flex flex-col gap-1">
          <h1 className="font-display text-display-sm font-bold lg:text-display-md">{HEADER[params.view][0]}</h1>
          <p className="text-small text-muted-foreground">{HEADER[params.view][1]}</p>
        </header>

        {/* Tab status bergaris bawah (beda gaya dari navigasi bagian). */}
        {isInbox && (
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
        )}

        {params.view === "statistik" && (
          <nav aria-label="Rentang waktu" className="flex flex-wrap gap-2">
            {PERIODS.map((d) => (
              <Link
                key={d}
                href={href({ days: d })}
                aria-current={params.days === d ? "true" : undefined}
                className={cn(
                  "inline-flex min-h-9 items-center rounded-full border-[1.5px] px-3.5 text-caption font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  params.days === d ? "border-foreground bg-foreground text-background" : "border-line text-soft-foreground hover:border-line-strong"
                )}
              >
                {d} hari
              </Link>
            ))}
          </nav>
        )}

        {params.view === "masukan" && (
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
        ) : params.view === "statistik" ? (
          stats && <StatsView stats={stats} />
        ) : params.view === "demo" ? (
          <DemoView devices={demo} defaultLabel={deviceLabel} now={now} enable={actions.enableDemo} revoke={actions.revokeDemo} />
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
