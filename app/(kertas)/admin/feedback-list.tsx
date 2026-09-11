import {
  AppWindowIcon,
  ArrowUpRightIcon,
  BugIcon,
  CameraOffIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleHelpIcon,
  FileIcon,
  HashIcon,
  LightbulbIcon,
  MessageSquareIcon,
  MicOffIcon,
  MonitorIcon,
  ReplyIcon,
  RotateCcwIcon,
  ShieldAlertIcon,
  SmartphoneIcon,
  TabletIcon,
  WifiOffIcon,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { feedbackLabel } from "@/lib/content/feedback"
import { parseUserAgent, type DeviceInfo } from "@/lib/device-info"
import { cn } from "@/lib/utils"
import { CopyDetails } from "./copy-details"
import { ago } from "./time"

export type FeedbackItem = {
  id: string
  kind: string
  message: string
  email: string | null
  room_code: string | null
  page: string | null
  user_agent: string | null
  meta: DeviceInfo | null
  suspect: boolean
  resolved: boolean
  created_at: number
}

export const KIND_STYLE = {
  bug: { icon: BugIcon, className: "bg-shutter/12 text-shutter" },
  masukan: { icon: LightbulbIcon, className: "bg-flash/30 text-[#7A5E00]" },
  pertanyaan: { icon: CircleHelpIcon, className: "bg-link/12 text-link" },
  lainnya: { icon: MessageSquareIcon, className: "bg-card text-soft-foreground" },
} as const

const PERMISSION: Record<string, string> = { granted: "Diizinkan", denied: "Ditolak", prompt: "Belum ditanya" }
const SESSION_SCREEN: Record<string, string> = {
  connecting: "Menyambung",
  undang: "Undang",
  izin: "Izin kamera",
  lobby: "Lobi",
  capture: "Foto",
  review: "Review",
  hasil: "Hasil",
  error: "Error",
}

const exactTime = (ms: number) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(ms) + " WIB"

// "14.0.0" → "14", "18.0" → "18" (versi dari Client Hints sering berekor .0).
const trimVersion = (v: string | undefined) => v?.replace(/(\.0)+$/, "")

// Info perangkat siap tampil. Kiriman lama (tanpa meta) diurai dari user agent.
function deviceOf(f: FeedbackItem) {
  const m: DeviceInfo = f.meta ?? {}
  const ua = f.user_agent ? parseUserAgent(f.user_agent) : null
  const str = (k: string) => (typeof m[k] === "string" || typeof m[k] === "number" ? String(m[k]) : undefined)

  const browser = str("browser") ?? ua?.browser
  const browserVersion = str("browserVersion") ?? ua?.browserVersion
  const os = str("os") ?? ua?.os
  const osVersion = trimVersion(str("osVersion") ?? ua?.osVersion)
  const model = str("model") ?? ua?.model
  const inApp = str("inApp") ?? ua?.inApp
  const type = str("device") ?? (f.user_agent ? (/iPad|Tablet/.test(f.user_agent) ? "Tablet" : /Mobi|Android|iPhone/.test(f.user_agent) ? "HP" : "Desktop") : undefined)

  const join = (...xs: (string | undefined | false)[]) => xs.filter(Boolean).join(" ")
  const summary = [join(browser, browserVersion?.split(".")[0]), join(os, osVersion), model ?? type].filter(Boolean).join(" · ")

  const rows: [string, string][] = []
  const add = (label: string, value: string | undefined | false) => value && rows.push([label, value])
  add("Browser", join(browser, browserVersion) + (inApp ? ` · dalam ${inApp}` : ""))
  add("Sistem", join(os, osVersion))
  add("Perangkat", [type, model].filter(Boolean).join(" · "))
  add("Layar", str("screen") && `${str("screen")}${str("dpr") ? ` · ${str("dpr")}x` : ""}`)
  add("Jendela", str("viewport"))
  add("Sentuh", typeof m.touch === "number" && (m.touch > 0 ? `${m.touch} titik` : "Tidak"))
  add("Bahasa", str("language"))
  add("Zona waktu", str("timezone"))
  add("Koneksi", m.online === false ? "Offline" : str("connection")?.toUpperCase())
  add("Kamera", str("camera") && (PERMISSION[str("camera")!] ?? str("camera")))
  add("Mikrofon", str("microphone") && (PERMISSION[str("microphone")!] ?? str("microphone")))
  add("Mode", typeof m.standalone === "boolean" && (m.standalone ? "Aplikasi terpasang" : "Browser"))
  add("Layar sesi", str("sessionScreen") && (SESSION_SCREEN[str("sessionScreen")!] ?? str("sessionScreen")))
  add("Memori · CPU", (str("memory") || str("cores")) && [str("memory") && `${str("memory")} GB`, str("cores") && `${str("cores")} core`].filter(Boolean).join(" · "))
  add("Versi app", str("app"))

  // Hal yang sering jadi penyebab bug, ditampilkan tanpa perlu buka detail.
  const flags: { icon: LucideIcon; label: string }[] = []
  if (m.camera === "denied") flags.push({ icon: CameraOffIcon, label: "Kamera ditolak" })
  if (m.microphone === "denied") flags.push({ icon: MicOffIcon, label: "Mikrofon ditolak" })
  if (m.online === false) flags.push({ icon: WifiOffIcon, label: "Offline" })
  if (inApp) flags.push({ icon: AppWindowIcon, label: `Dibuka dari ${inApp}` })

  const Icon = type === "HP" ? SmartphoneIcon : type === "Tablet" ? TabletIcon : MonitorIcon
  return { summary, rows, flags, Icon, legacy: !f.meta }
}

function copyText(f: FeedbackItem, rows: [string, string][]) {
  return [
    `[${feedbackLabel(f.kind)}] ${exactTime(f.created_at)}`,
    f.message,
    "",
    f.email && `Email: ${f.email}`,
    f.room_code && `Room: ${f.room_code}`,
    f.page && `Halaman: ${f.page}`,
    ...rows.map(([k, v]) => `${k}: ${v}`),
    f.user_agent && `User agent: ${f.user_agent}`,
  ]
    .filter((x) => x !== null && x !== undefined)
    .join("\n")
}

function Chip({
  icon: Icon,
  children,
  href,
  warn = false,
  mono = false,
}: {
  icon: LucideIcon
  children: React.ReactNode
  href?: string
  warn?: boolean
  mono?: boolean
}) {
  const className = cn(
    "inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-caption",
    warn ? "bg-shutter/10 font-semibold text-shutter" : "bg-card text-soft-foreground",
    mono && "font-mono"
  )
  const inner = (
    <>
      <Icon aria-hidden className="size-3.5 shrink-0" />
      <span className="truncate">{children}</span>
      {href && <ArrowUpRightIcon aria-hidden className="size-3 shrink-0" />}
    </>
  )
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(className, "outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50")}
    >
      {inner}
    </a>
  ) : (
    <span className={className}>{inner}</span>
  )
}

// Kiriman Pusat bantuan, gaya kotak masuk: kepala (jenis, pengirim, waktu) +
// aksi di kanan (layar lebar) / bawah (HP), isi pesan, konteks & tanda
// penting, lalu panel perangkat yang bisa dibuka & disalin.
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
        const KindIcon = k.icon
        const dev = deviceOf(f)
        const subject = encodeURIComponent(`Re: [Bareng] ${f.message.slice(0, 50)}`)
        // Halaman sesi (/r/…) tidak ditautkan: membukanya berarti ikut masuk room.
        const pageHref = f.page && f.page.startsWith("/") && !/^\/(r|admin|dev)(\/|$)/.test(f.page) ? f.page : undefined
        const hasContext = f.room_code || f.page || dev.flags.length > 0
        return (
          <li
            key={f.id}
            className={cn("@container rounded-md border-[1.5px] bg-sunken", f.resolved ? "border-line" : "border-line-strong")}
          >
            <div className="grid gap-x-6 gap-y-4 p-4 @2xl:grid-cols-[minmax(0,1fr)_auto] @2xl:p-6">
              {/* Kepala: jenis, status, pengirim & waktu */}
              <div className="flex min-w-0 items-center gap-3">
                <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-full", k.className, f.resolved && "opacity-60")}>
                  <KindIcon className="size-[18px]" />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-label font-semibold">{feedbackLabel(f.kind)}</span>
                    {f.resolved && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ok/15 px-2 py-0.5 text-caption font-semibold text-ok">
                        <CheckIcon aria-hidden className="size-3" strokeWidth={3} />
                        Selesai
                      </span>
                    )}
                    {f.suspect && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-caption font-semibold text-soft-foreground">
                        <ShieldAlertIcon aria-hidden className="size-3" />
                        Kemungkinan spam
                      </span>
                    )}
                  </div>
                  <span className="flex min-w-0 items-center gap-1.5 text-meta text-muted-foreground">
                    <span className={cn("truncate", f.email && "text-soft-foreground")}>{f.email ?? "Anonim"}</span>
                    <span aria-hidden>·</span>
                    <time dateTime={new Date(f.created_at).toISOString()} title={exactTime(f.created_at)} className="shrink-0">
                      {ago(f.created_at, now)}
                    </time>
                  </span>
                </div>
              </div>

              {/* Aksi: kanan atas di layar lebar, paling bawah di HP */}
              <div className="order-last flex gap-2 @2xl:order-none @2xl:col-start-2 @2xl:row-start-1 @2xl:self-center">
                {f.email && !f.resolved && (
                  <Button size="sm" className="flex-1 @2xl:flex-none" render={<a href={`mailto:${f.email}?subject=${subject}`} />} nativeButton={false}>
                    <ReplyIcon data-icon="inline-start" />
                    Balas
                  </Button>
                )}
                <form action={action} className="flex flex-1 @2xl:flex-none">
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="resolved" value={f.resolved ? "0" : "1"} />
                  <Button variant={f.resolved ? "ghost" : "soft"} size="sm" type="submit" className="w-full">
                    {f.resolved ? <RotateCcwIcon data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" />}
                    {f.resolved ? "Buka lagi" : "Tandai selesai"}
                  </Button>
                </form>
              </div>

              {/* Isi: rata dengan teks kepala di layar lebar */}
              <div className="flex min-w-0 flex-col gap-3.5 @2xl:col-span-2 @2xl:pl-[52px]">
                <p className={cn("max-w-[68ch] text-body leading-relaxed break-words whitespace-pre-wrap", f.resolved && "text-soft-foreground")}>
                  {f.message}
                </p>

                {f.suspect && (
                  <p className="-mt-1 text-caption text-muted-foreground">
                    Kolom anti-bot terisi (bisa bot, bisa juga autofill browser), jadi tidak dikirim ke email.
                  </p>
                )}

                {hasContext && (
                  <div className="flex flex-wrap gap-1.5">
                    {f.room_code && (
                      <Chip icon={HashIcon} mono>
                        {f.room_code}
                      </Chip>
                    )}
                    {f.page && (
                      <Chip icon={FileIcon} href={pageHref} mono>
                        {f.page}
                      </Chip>
                    )}
                    {dev.flags.map(({ icon, label }) => (
                      <Chip key={label} icon={icon} warn>
                        {label}
                      </Chip>
                    ))}
                  </div>
                )}

                {(dev.rows.length > 0 || f.user_agent) && (
                  <details className="group rounded-md border-[1.5px] border-line bg-background/50 open:bg-background/70">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2.5 rounded-md px-3.5 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                      <dev.Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 truncate text-meta text-soft-foreground">{dev.summary || "Perangkat tidak diketahui"}</span>
                      <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-caption font-semibold">
                        <span className="group-open:hidden">Detail</span>
                        <span className="hidden group-open:inline">Tutup</span>
                        <ChevronDownIcon aria-hidden className="size-3.5 transition-transform group-open:rotate-180" />
                      </span>
                    </summary>
                    <div className="flex flex-col gap-4 border-t-[1.5px] border-line px-3.5 pt-3.5 pb-3">
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 @xl:grid-cols-3 @4xl:grid-cols-4">
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <dt className="text-caption text-muted-foreground">Dikirim</dt>
                          <dd className="text-small">{exactTime(f.created_at)}</dd>
                        </div>
                        {dev.rows.map(([label, value]) => (
                          <div key={label} className="flex min-w-0 flex-col gap-0.5">
                            <dt className="text-caption text-muted-foreground">{label}</dt>
                            <dd className="text-small break-words">{value}</dd>
                          </div>
                        ))}
                      </dl>
                      {f.user_agent && (
                        <div className="flex flex-col gap-1">
                          <span className="text-caption text-muted-foreground">
                            User agent{dev.legacy && " (kiriman lama, detail lain belum tercatat)"}
                          </span>
                          <code className="rounded-sm bg-card px-3 py-2 font-mono text-caption break-all text-soft-foreground">{f.user_agent}</code>
                        </div>
                      )}
                      <div className="-ml-2">
                        <CopyDetails text={copyText(f, dev.rows)} />
                      </div>
                    </div>
                  </details>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
