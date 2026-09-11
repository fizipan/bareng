import { BugIcon, CheckIcon, CircleHelpIcon, LightbulbIcon, MailIcon, MessageSquareIcon, MonitorSmartphoneIcon, RotateCcwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { feedbackLabel } from "@/lib/content/feedback"
import { cn } from "@/lib/utils"

export type FeedbackItem = {
  id: string
  kind: string
  message: string
  email: string | null
  room_code: string | null
  page: string | null
  user_agent: string | null
  resolved: boolean
  created_at: number
}

const KIND = {
  bug: { icon: BugIcon, className: "bg-shutter/12 text-shutter" },
  masukan: { icon: LightbulbIcon, className: "bg-flash/25 text-[#8A6A00]" },
  pertanyaan: { icon: CircleHelpIcon, className: "bg-link/12 text-link" },
  lainnya: { icon: MessageSquareIcon, className: "bg-card text-soft-foreground" },
} as const

// Ringkas user agent jadi "Chrome · Android" dsb.
function device(ua: string | null) {
  if (!ua) return null
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : null
  const browser = /SamsungBrowser/.test(ua)
    ? "Samsung Internet"
    : /CriOS|Chrome\//.test(ua) && !/Edg/.test(ua)
      ? "Chrome"
      : /Edg/.test(ua)
        ? "Edge"
        : /Firefox|FxiOS/.test(ua)
          ? "Firefox"
          : /Safari/.test(ua)
            ? "Safari"
            : null
  return [browser, os].filter(Boolean).join(" · ") || "Tidak diketahui"
}

function ago(ms: number, now: number) {
  const m = Math.max(0, Math.round((now - ms) / 60_000))
  if (m < 1) return "baru saja"
  if (m < 60) return `${m} menit lalu`
  const h = Math.round(m / 60)
  return h < 24 ? `${h} jam lalu` : `${Math.round(h / 24)} hari lalu`
}

// Kiriman Pusat bantuan: yang belum selesai di atas, bisa ditandai selesai /
// dibuka lagi. Balas lewat email pengirim kalau diisi.
export function FeedbackList({
  items,
  action,
  now,
}: {
  items: FeedbackItem[]
  action: (form: FormData) => Promise<void>
  now: number
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md bg-card px-5 py-12 text-center">
        <MessageSquareIcon aria-hidden className="size-6 text-muted-foreground" />
        <span className="text-label font-semibold">Belum ada masukan</span>
        <span className="text-small text-muted-foreground">Kiriman dari Pusat bantuan & tombol bantuan muncul di sini.</span>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((f) => {
        const k = KIND[f.kind as keyof typeof KIND] ?? KIND.lainnya
        const Icon = k.icon
        const dev = device(f.user_agent)
        return (
          <li
            key={f.id}
            className={cn(
              "flex flex-col gap-3 rounded-md border-[1.5px] p-4",
              f.resolved ? "border-line opacity-65" : "border-foreground"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-semibold", k.className)}>
                <Icon aria-hidden className="size-3.5" />
                {feedbackLabel(f.kind)}
              </span>
              <span className="text-caption text-muted-foreground">
                {ago(f.created_at, now)}
                {f.resolved && " · selesai"}
              </span>
            </div>
            <p className="text-body whitespace-pre-wrap">{f.message}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-caption text-muted-foreground">
              {f.email && (
                <a href={`mailto:${f.email}`} className="inline-flex items-center gap-1.5 font-semibold text-link underline-offset-4 hover:underline">
                  <MailIcon aria-hidden className="size-3.5" />
                  {f.email}
                </a>
              )}
              {f.room_code && <span className="font-mono tracking-[0.1em]">Room {f.room_code}</span>}
              {dev && (
                <span className="inline-flex items-center gap-1.5" title={f.user_agent ?? undefined}>
                  <MonitorSmartphoneIcon aria-hidden className="size-3.5" />
                  {dev}
                </span>
              )}
              {f.page && <span className="font-mono">{f.page}</span>}
            </div>
            <form action={action} className="flex gap-2">
              <input type="hidden" name="id" value={f.id} />
              <input type="hidden" name="resolved" value={f.resolved ? "0" : "1"} />
              <Button variant={f.resolved ? "ghost" : "secondary"} size="sm" type="submit">
                {f.resolved ? <RotateCcwIcon data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" />}
                {f.resolved ? "Buka lagi" : "Tandai selesai"}
              </Button>
            </form>
          </li>
        )
      })}
    </ul>
  )
}
