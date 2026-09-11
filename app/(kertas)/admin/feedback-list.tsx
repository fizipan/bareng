import {
  BugIcon,
  CheckIcon,
  CircleHelpIcon,
  FileIcon,
  HashIcon,
  LightbulbIcon,
  MailIcon,
  MessageSquareIcon,
  MonitorSmartphoneIcon,
  ReplyIcon,
  RotateCcwIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { feedbackLabel } from "@/lib/content/feedback"
import { cn } from "@/lib/utils"
import { ago } from "./time"

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

export const KIND_STYLE = {
  bug: { icon: BugIcon, className: "bg-shutter/12 text-shutter" },
  masukan: { icon: LightbulbIcon, className: "bg-flash/30 text-[#7A5E00]" },
  pertanyaan: { icon: CircleHelpIcon, className: "bg-link/12 text-link" },
  lainnya: { icon: MessageSquareIcon, className: "bg-card text-soft-foreground" },
} as const

// Ringkas user agent jadi "Chrome · Android" dsb.
function device(ua: string | null) {
  if (!ua) return null
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : null
  const browser = /SamsungBrowser/.test(ua)
    ? "Samsung Internet"
    : /Edg/.test(ua)
      ? "Edge"
      : /CriOS|Chrome\//.test(ua)
        ? "Chrome"
        : /Firefox|FxiOS/.test(ua)
          ? "Firefox"
          : /Safari/.test(ua)
            ? "Safari"
            : null
  return [browser, os].filter(Boolean).join(" · ") || "Tidak diketahui"
}

const Chip = ({ icon: Icon, children, title, mono = false }: { icon: typeof MailIcon; children: React.ReactNode; title?: string; mono?: boolean }) => (
  <span title={title} className={cn("inline-flex max-w-full items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-caption text-soft-foreground", mono && "font-mono")}>
    <Icon aria-hidden className="size-3.5 shrink-0" />
    <span className="truncate">{children}</span>
  </span>
)

// Kiriman Pusat bantuan: jenis, isi, konteks (email, room, perangkat,
// halaman), balas lewat email & tandai selesai / buka lagi.
export function FeedbackList({
  items,
  action,
  now,
  emptyText,
}: {
  items: FeedbackItem[]
  action: (form: FormData) => Promise<void>
  now: number
  emptyText: string
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border-[1.5px] border-dashed border-line px-5 py-14 text-center">
        <MessageSquareIcon aria-hidden className="size-7 text-muted-foreground" />
        <span className="text-small text-muted-foreground">{emptyText}</span>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((f) => {
        const k = KIND_STYLE[f.kind as keyof typeof KIND_STYLE] ?? KIND_STYLE.lainnya
        const Icon = k.icon
        const dev = device(f.user_agent)
        const subject = encodeURIComponent(`Re: [Bareng] ${f.message.slice(0, 50)}`)
        return (
          <li key={f.id} className={cn("flex gap-3.5 rounded-md border-[1.5px] bg-sunken p-4 lg:p-5", f.resolved ? "border-line" : "border-line-strong")}>
            <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-full", k.className)}>
              <Icon className="size-[18px]" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-small font-semibold">{feedbackLabel(f.kind)}</span>
                <span className="text-caption text-muted-foreground">· {ago(f.created_at, now)}</span>
                {f.resolved && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-ok/15 px-2 py-0.5 text-caption font-semibold text-ok">
                    <CheckIcon aria-hidden className="size-3" strokeWidth={3} />
                    Selesai
                  </span>
                )}
              </div>
              <p className={cn("text-body whitespace-pre-wrap", f.resolved && "text-soft-foreground")}>{f.message}</p>
              <div className="flex flex-wrap gap-1.5">
                {f.email && <Chip icon={MailIcon}>{f.email}</Chip>}
                {f.room_code && (
                  <Chip icon={HashIcon} mono>
                    {f.room_code}
                  </Chip>
                )}
                {dev && (
                  <Chip icon={MonitorSmartphoneIcon} title={f.user_agent ?? undefined}>
                    {dev}
                  </Chip>
                )}
                {f.page && (
                  <Chip icon={FileIcon} mono>
                    {f.page}
                  </Chip>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {f.email && !f.resolved && (
                  <Button size="sm" render={<a href={`mailto:${f.email}?subject=${subject}`} />} nativeButton={false}>
                    <ReplyIcon data-icon="inline-start" />
                    Balas
                  </Button>
                )}
                <form action={action}>
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="resolved" value={f.resolved ? "0" : "1"} />
                  <Button variant={f.resolved ? "ghost" : "secondary"} size="sm" type="submit">
                    {f.resolved ? <RotateCcwIcon data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" />}
                    {f.resolved ? "Buka lagi" : "Tandai selesai"}
                  </Button>
                </form>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
