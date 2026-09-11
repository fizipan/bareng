import Link from "next/link"
import { EyeOffIcon, FlagIcon } from "lucide-react"
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
  reports: number
  pending: number
  reasons: string[]
  last_report: number
}

function ago(ms: number, now: number) {
  const m = Math.max(0, Math.round((now - ms) / 60_000))
  if (m < 1) return "baru saja"
  if (m < 60) return `${m} menit lalu`
  const h = Math.round(m / 60)
  return h < 24 ? `${h} jam lalu` : `${Math.round(h / 24)} hari lalu`
}

// Antrean laporan per photostrip: yang menunggu ditinjau di atas, dengan
// tombol Turunkan (konfirmasi dulu) & Abaikan.
export function ReportQueue({
  queue,
  action,
  now,
}: {
  queue: QueueItem[]
  action: (form: FormData) => Promise<void>
  now: number
}) {
  return (
      <ul className="flex flex-col gap-3">
        {queue.map((q) => (
          <li
            key={q.slug}
            className={cn(
              "flex gap-4 rounded-md border-[1.5px] p-3.5",
              q.pending > 0 && !q.removed ? "border-foreground" : "border-line opacity-70"
            )}
          >
            <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-sm bg-card">
              {q.image_path && !q.removed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={publicResultUrl(q.image_path)} alt="" className="size-full object-cover object-top" />
              ) : (
                <EyeOffIcon aria-hidden className="absolute inset-0 m-auto size-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-label font-semibold">{q.names ?? "Photostrip berdua"}</span>
                {!q.removed ? (
                  <Link href={`/p/${q.slug}`} target="_blank" className="font-mono text-caption text-link underline-offset-4 hover:underline">
                    /p/{q.slug}
                  </Link>
                ) : (
                  <span className="font-mono text-caption text-muted-foreground">/p/{q.slug}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(q.reasons.length ? q.reasons : [null]).map((r) => (
                  <span key={r ?? "none"} className="rounded-full bg-card px-2.5 py-1 text-caption">
                    {reasonLabel(r)}
                  </span>
                ))}
              </div>
              <span className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
                <FlagIcon aria-hidden className="size-3.5" />
                {q.reports} laporan · terakhir {ago(q.last_report, now)}
                {q.removed ? " · sudah diturunkan" : q.pending === 0 ? " · sudah ditinjau" : ""}
              </span>
              {q.pending > 0 && !q.removed && (
                <form action={action} className="flex flex-wrap gap-2 pt-1">
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
              )}
            </div>
          </li>
        ))}
      </ul>
  )
}
