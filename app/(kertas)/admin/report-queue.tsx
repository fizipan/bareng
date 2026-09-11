import Link from "next/link"
import { ArrowUpRightIcon, EyeOffIcon, FlagIcon, ShieldCheckIcon } from "lucide-react"
import { reasonLabel } from "@/lib/content/report-reasons"
import { publicResultUrl } from "@/lib/results-url"
import { cn } from "@/lib/utils"
import { ConfirmAction } from "./confirm-action"
import { ago } from "./time"

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

export const needsReview = (q: QueueItem) => q.pending > 0 && !q.removed

function status(q: QueueItem) {
  if (q.taken_down) return { label: "Diturunkan", className: "bg-darkroom text-kertas" }
  if (q.removed) return { label: "Dihapus pemiliknya", className: "bg-card text-soft-foreground" }
  if (q.pending > 0) return { label: "Menunggu", className: "bg-shutter/12 text-shutter" }
  return { label: "Diabaikan", className: "bg-ok/15 text-ok" }
}

// Laporan yang perlu ditinjau: pratinjau, alasan, catatan, Turunkan/Abaikan.
export function ReviewList({
  items,
  action,
  now,
}: {
  items: QueueItem[]
  action: (form: FormData) => Promise<void>
  now: number
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border-[1.5px] border-dashed border-line px-5 py-14 text-center">
        <ShieldCheckIcon aria-hidden className="size-7 text-ok" />
        <span className="text-label font-semibold">Semua beres</span>
        <span className="text-small text-muted-foreground">Kalau ada laporan baru, kamu juga dapat email.</span>
      </div>
    )
  }
  return (
    <ul className="flex flex-col gap-3">
      {items.map((q) => (
        <li key={q.slug} className="flex gap-4 rounded-md border-[1.5px] border-line-strong bg-sunken p-4 lg:p-5">
          <Link
            href={`/p/${q.slug}`}
            target="_blank"
            aria-label={`Buka photostrip ${q.slug} di tab baru`}
            className="relative h-[124px] w-[82px] shrink-0 overflow-hidden rounded-sm bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
              <span className="shrink-0 rounded-full bg-shutter/12 px-2.5 py-1 text-caption font-semibold text-shutter">
                {q.pending} laporan
              </span>
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
                  <li key={i} className="rounded-sm border-l-2 border-line-strong bg-background px-3 py-2 text-small text-soft-foreground">
                    “{n.note}”
                  </li>
                ))}
              </ul>
            )}
            <span className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
              <FlagIcon aria-hidden className="size-3.5" />
              Terakhir dilaporkan {ago(q.last_report, now)}
            </span>
            <div className="flex flex-wrap gap-2 pt-0.5">
              <ConfirmAction
                action={action}
                fields={{ slug: q.slug, takedown: "1" }}
                icon="turunkan"
                label="Turunkan"
                variant="primary"
                title="Turunkan photostrip ini?"
                description={
                  <>
                    Link <span className="font-mono">/p/{q.slug}</span> langsung mati untuk semua orang, termasuk mereka
                    berdua. Tidak bisa dibatalkan.
                  </>
                }
                confirmLabel="Ya, turunkan"
              />
              <ConfirmAction
                action={action}
                fields={{ slug: q.slug, takedown: "0" }}
                icon="abaikan"
                label="Abaikan"
                title="Abaikan laporan ini?"
                description="Photostrip tetap bisa dilihat. Laporannya pindah ke Selesai sebagai diabaikan."
                confirmLabel="Ya, abaikan"
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

// Riwayat laporan yang sudah ditangani: satu baris per photostrip.
export function HistoryList({ items, now }: { items: QueueItem[]; now: number }) {
  if (items.length === 0) {
    return (
      <p className="rounded-md border-[1.5px] border-dashed border-line px-5 py-12 text-center text-small text-muted-foreground">
        Belum ada riwayat.
      </p>
    )
  }
  return (
    <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-md border-[1.5px] border-line bg-sunken">
      {items.map((q) => {
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
  )
}
