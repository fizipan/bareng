import {
  ChartNoAxesColumnIcon,
  CheckIcon,
  ClockIcon,
  InfinityIcon,
  MailIcon,
  MonitorSmartphoneIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react"
import { SITE_HOST } from "@/lib/brand"
import type { DeviceInfo } from "@/lib/device-info"
import { cn } from "@/lib/utils"
import { ConfirmAction } from "./confirm-action"
import { DemoDecide } from "./demo-decide"
import { ThisDevice } from "./this-device"
import { ago } from "./time"

export type DemoDevice = {
  user_id: string
  label: string | null
  created_at: number
  expires_at: number | null
  rooms: number
  last_room_at: number | null
}

export type DemoRequest = {
  id: string
  name: string
  contact: string | null
  note: string | null
  meta: DeviceInfo | null
  status: "pending" | "approved" | "rejected"
  created_at: number
  decided_at: number | null
}

const PERKS = [
  { icon: InfinityIcon, text: "Tanpa batas 3 sesi per hari" },
  { icon: SparklesIcon, text: "Room langsung premium: semua template, tanpa watermark, HD" },
  { icon: ChartNoAxesColumnIcon, text: "Tidak dihitung di Statistik" },
]

const date = (ms: number) => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(ms)

// "SM-A546E · Android" dari info perangkat yang ikut terkirim.
function deviceOf(meta: DeviceInfo | null) {
  if (!meta) return null
  const str = (k: string) => (typeof meta[k] === "string" ? (meta[k] as string) : undefined)
  return [str("model") ?? str("browser"), str("os")].filter(Boolean).join(" · ") || null
}

// Perangkat demo: permintaan yang masuk, status browser ini, dan daftar
// perangkat yang aktif.
export function DemoView({
  devices,
  requests,
  defaultLabel,
  now,
  enable,
  revoke,
  decide,
}: {
  devices: DemoDevice[]
  requests: DemoRequest[]
  defaultLabel: string
  now: number
  enable: (token: string, label: string) => Promise<{ ok: boolean }>
  revoke: (form: FormData) => Promise<void>
  decide: (form: FormData) => Promise<void>
}) {
  const pending = requests.filter((r) => r.status === "pending")
  const decided = requests.filter((r) => r.status !== "pending")

  return (
    <div className="flex flex-col gap-7">
      <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-5">
        {PERKS.map(({ icon: Icon, text }) => (
          <li key={text} className="inline-flex items-center gap-2 text-small text-soft-foreground">
            <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            {text}
          </li>
        ))}
      </ul>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-label font-semibold">Permintaan masuk</h2>
          <p className="text-caption text-muted-foreground">
            Orang minta dari {SITE_HOST}/demo, lalu kamu setujui di sini.
          </p>
        </div>
        {pending.length === 0 ? (
          <p className="rounded-md border-[1.5px] border-dashed border-line px-5 py-8 text-center text-small text-muted-foreground">
            Tidak ada permintaan yang menunggu.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((r) => (
              <li key={r.id} className="flex flex-col gap-3.5 rounded-md border-[1.5px] border-line-strong bg-sunken p-4 lg:p-5">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="text-label font-semibold">{r.name}</span>
                  <span className="text-caption text-muted-foreground">{ago(r.created_at, now)}</span>
                </div>
                {r.note && <p className="text-body break-words whitespace-pre-wrap">{r.note}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-caption text-soft-foreground">
                  {r.contact && (
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <MailIcon aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{r.contact}</span>
                    </span>
                  )}
                  {deviceOf(r.meta) && (
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <MonitorSmartphoneIcon aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{deviceOf(r.meta)}</span>
                    </span>
                  )}
                </div>
                <DemoDecide id={r.id} name={r.name} action={decide} />
              </li>
            ))}
          </ul>
        )}
        {decided.length > 0 && (
          <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-md border-[1.5px] border-line bg-sunken">
            {decided.slice(0, 8).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
                <span className="min-w-0 flex-1 truncate text-small">{r.name}</span>
                <span className="text-caption text-muted-foreground">{r.decided_at ? ago(r.decided_at, now) : ""}</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-semibold",
                    r.status === "approved" ? "bg-ok/15 text-ok" : "bg-card text-soft-foreground"
                  )}
                >
                  {r.status === "approved" ? <CheckIcon aria-hidden className="size-3" strokeWidth={3} /> : <XIcon aria-hidden className="size-3" />}
                  {r.status === "approved" ? "Disetujui" : "Ditolak"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-label font-semibold">Perangkat aktif</h2>
        {devices.length === 0 ? (
          <p className="rounded-md border-[1.5px] border-dashed border-line px-5 py-8 text-center text-small text-muted-foreground">
            Belum ada perangkat demo.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-md border-[1.5px] border-line bg-sunken">
            {devices.map((d) => {
              const habis = d.expires_at != null && d.expires_at < now
              return (
                <li key={d.user_id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3.5">
                  <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-card text-soft-foreground">
                    <MonitorSmartphoneIcon className="size-[18px]" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-small font-semibold">{d.label ?? "Perangkat tanpa nama"}</span>
                    <span className="text-caption text-muted-foreground">
                      {d.rooms} room
                      {d.last_room_at ? ` · terakhir dipakai ${ago(d.last_room_at, now)}` : ""}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-semibold",
                      habis ? "bg-shutter/10 text-shutter" : "bg-card text-soft-foreground"
                    )}
                  >
                    {d.expires_at == null ? (
                      <>
                        <InfinityIcon aria-hidden className="size-3.5" />
                        Tanpa batas
                      </>
                    ) : (
                      <>
                        <ClockIcon aria-hidden className="size-3.5" />
                        {habis ? "Berakhir" : `Sampai ${date(d.expires_at)}`}
                      </>
                    )}
                  </span>
                  <ConfirmAction
                    action={revoke}
                    fields={{ user: d.user_id }}
                    icon="cabut"
                    label="Cabut"
                    variant="ghost"
                    title="Cabut perangkat demo ini?"
                    description="Room baru dari perangkat ini kembali gratis dan kena batas harian. Foto yang sudah jadi tidak berubah."
                    confirmLabel="Ya, cabut"
                  />
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-label font-semibold">Perangkat ini</h2>
        <ThisDevice ids={devices.map((d) => d.user_id)} defaultLabel={defaultLabel} enable={enable} />
        <p className="text-caption text-muted-foreground">
          Status demo menempel di data browser. Kalau data browser dihapus atau pindah browser, daftarkan lagi dari sini.
        </p>
      </section>
    </div>
  )
}
