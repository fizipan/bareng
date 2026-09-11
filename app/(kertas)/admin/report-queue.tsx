import Link from "next/link"
import { ArrowUpRightIcon, EyeOffIcon, FlagIcon, ShieldCheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { reasonLabel } from "@/lib/content/report-reasons"
import { publicResultUrl } from "@/lib/results-url"
import { cn } from "@/lib/utils"
import { ConfirmButton } from "./confirm-button"

export type QueueItem = {
  slug: string
  names: string | null
  image_path: string | null
  removed: boolean
  taken_down: boolean
  reports: number
  pending: number
  reasons: { reason: string | null; n: number }[]
  notes: { reason: string | null; note: string }[]
  last_report: number
}

export type AdminTab = "tinjau" | "selesai"

const needsReview = (q: QueueItem) => q.pending > 0 && !q.removed

function status(q: QueueItem) {
  if (q.taken_down) return { label: "Diturunkan", className: "bg-darkroom text-kertas" }
  if (q.removed) return { label: "Dihapus pemiliknya", className: "bg-card text-soft-foreground" }
  if (q.pending > 0) return { label: "Menunggu", className: "bg-shutter/12 text-shutter" }
  return { label: "Diabaikan", className: "bg-ok/15 text-ok" }
}

function ago(ms: number, now: number) {
  const m = Math.max(0, Math.round((now - ms) / 60_000))
  if (m < 1) return "baru saja"
  if (m < 60) return `${m} menit lalu`
  const h = Math.round(m / 60)
  return h < 24 ? `${h} jam lalu` : `${Math.round(h / 24)} hari lalu`
}

// Antrean laporan /admin: tab "Perlu ditinjau" (kartu dengan pratinjau,
// alasan, catatan, tombol Turunkan/Abaikan) & "Selesai" (riwayat ringkas).
export function AdminQueue({
  queue,
  tab,
  action,
  now,
  hrefFor,
}: {
  queue: QueueItem[]
  tab: AdminTab
  action: (form: FormData) => Promise<void>
  now: number
  hrefFor: (tab: AdminTab) => string
}) {
  const open = queue.filter(needsReview)
  const done = queue.filter((q) => !needsReview(q))

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Status laporan" className="flex self-start rounded-full bg-card p-1">
        {(
          [
            ["tinjau", "Perlu ditinjau", open.length],
            ["selesai", "Selesai", done.length],
          ] as const
        ).map(([key, label, n]) => (
          <Link
            key={key}
            href={hrefFor(key)}
            aria-current={tab === key ? "page" : undefined}
            className={cn(
              "inline-flex min-h-9 items-center gap-2 rounded-full px-4 text-small font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              tab === key ? "bg-background text-foreground shadow-[0_1px_3px_rgb(22_20_29/0.1)]" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
            <span
              className={cn(
                "min-w-5 rounded-full px-1.5 text-center text-caption tabular-nums",
                key === "tinjau" && n > 0 ? "bg-shutter text-kertas" : "bg-line text-soft-foreground"
              )}
            >
              {n}
            </span>
          </Link>
        ))}
      </nav>

      {tab === "tinjau" ? (
        open.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-md bg-card px-5 py-12 text-center">
            <ShieldCheckIcon aria-hidden className="size-6 text-ok" />
            <span className="text-label font-semibold">Semua beres</span>
            <span className="text-small text-muted-foreground">Kalau ada laporan baru, kamu juga dapat email.</span>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {open.map((q) => (
              <ReviewCard key={q.slug} q={q} now={now} action={action} />
            ))}
          </ul>
        )
      ) : done.length === 0 ? (
        <p className="rounded-md bg-card px-5 py-10 text-center text-small text-muted-foreground">Belum ada riwayat.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-md border-[1.5px] border-line">
          {done.map((q) => {
            const s = status(q)
            return (
              <li key={q.slug} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="text-small font-semibold">{q.names ?? "Photostrip berdua"}</span>{" "}
                  <span className="font-mono text-caption text-muted-foreground">/p/{q.slug}</span>
                </span>
                <span className="text-caption text-muted-foreground">
                  {q.reports} laporan · {ago(q.last_report, now)}
                </span>
                <span className={cn("rounded-full px-2.5 py-1 text-caption font-semibold", s.className)}>{s.label}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function ReviewCard({ q, now, action }: { q: QueueItem; now: number; action: (form: FormData) => Promise<void> }) {
  const s = status(q)
  return (
    <li className="flex gap-4 rounded-md border-[1.5px] border-foreground p-4">
      <Link
        href={`/p/${q.slug}`}
        target="_blank"
        aria-label={`Buka photostrip ${q.slug} di tab baru`}
        className="relative h-[120px] w-20 shrink-0 overflow-hidden rounded-sm bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {q.image_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={publicResultUrl(q.image_path)} alt="" className="size-full object-cover object-top" />
        ) : (
          <EyeOffIcon aria-hidden className="absolute inset-0 m-auto size-5 text-muted-foreground" />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-label font-semibold">{q.names ?? "Photostrip berdua"}</span>
            <Link
              href={`/p/${q.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 self-start font-mono text-caption text-link underline-offset-4 hover:underline"
            >
              /p/{q.slug}
              <ArrowUpRightIcon aria-hidden className="size-3" />
            </Link>
          </span>
          <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-caption font-semibold", s.className)}>{s.label}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {q.reasons.map((r) => (
            <span key={r.reason ?? "none"} className="rounded-full bg-card px-2.5 py-1 text-caption">
              {reasonLabel(r.reason)}
              {r.n > 1 && <span className="font-semibold"> · {r.n}</span>}
            </span>
          ))}
        </div>
        {q.notes.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {q.notes.map((n, i) => (
              <li key={i} className="rounded-sm border-l-2 border-line-strong bg-sunken px-3 py-2 text-small text-soft-foreground">
                “{n.note}”
              </li>
            ))}
          </ul>
        )}
        <span className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
          <FlagIcon aria-hidden className="size-3.5" />
          {q.reports} laporan · terakhir {ago(q.last_report, now)}
        </span>
        <form action={action} className="flex flex-wrap gap-2">
          <input type="hidden" name="slug" value={q.slug} />
          <ConfirmButton
            name="takedown"
            value="1"
            size="sm"
            message="Turunkan photostrip ini? Link-nya mati untuk semua orang dan tidak bisa dibatalkan."
          >
            Turunkan
          </ConfirmButton>
          <Button variant="secondary" size="sm" type="submit" name="takedown" value="0">
            Abaikan
          </Button>
        </form>
      </div>
    </li>
  )
}
