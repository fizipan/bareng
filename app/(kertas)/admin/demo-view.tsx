import { InfinityIcon, MonitorSmartphoneIcon, SparklesIcon, ChartNoAxesColumnIcon } from "lucide-react"
import { ConfirmAction } from "./confirm-action"
import { ThisDevice } from "./this-device"
import { ago } from "./time"

export type DemoDevice = {
  user_id: string
  label: string | null
  created_at: number
  rooms: number
  last_room_at: number | null
}

const PERKS = [
  { icon: InfinityIcon, text: "Tanpa batas 3 sesi per hari" },
  { icon: SparklesIcon, text: "Room langsung premium: semua template, tanpa watermark, HD" },
  { icon: ChartNoAxesColumnIcon, text: "Tidak dihitung di Statistik" },
]

// Perangkat demo: status browser ini + daftar perangkat terdaftar (bisa dicabut).
export function DemoView({
  devices,
  defaultLabel,
  now,
  enable,
  revoke,
}: {
  devices: DemoDevice[]
  defaultLabel: string
  now: number
  enable: (token: string, label: string) => Promise<{ ok: boolean }>
  revoke: (form: FormData) => Promise<void>
}) {
  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-5">
        {PERKS.map(({ icon: Icon, text }) => (
          <li key={text} className="inline-flex items-center gap-2 text-small text-soft-foreground">
            <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            {text}
          </li>
        ))}
      </ul>

      <ThisDevice ids={devices.map((d) => d.user_id)} defaultLabel={defaultLabel} enable={enable} />

      <section className="flex flex-col gap-3">
        <h2 className="text-label font-semibold">Perangkat terdaftar</h2>
        {devices.length === 0 ? (
          <p className="rounded-md border-[1.5px] border-dashed border-line px-5 py-10 text-center text-small text-muted-foreground">
            Belum ada perangkat demo.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-md border-[1.5px] border-line bg-sunken">
            {devices.map((d) => (
              <li key={d.user_id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3.5">
                <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-card text-soft-foreground">
                  <MonitorSmartphoneIcon className="size-[18px]" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-small font-semibold">{d.label ?? "Perangkat tanpa nama"}</span>
                  <span className="text-caption text-muted-foreground">
                    Didaftarkan {ago(d.created_at, now)} · {d.rooms} room
                    {d.last_room_at ? ` · terakhir dipakai ${ago(d.last_room_at, now)}` : ""}
                  </span>
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
            ))}
          </ul>
        )}
        <p className="text-caption text-muted-foreground">
          Status demo menempel di data browser. Kalau data browser dihapus atau pindah browser, daftarkan lagi dari sini.
        </p>
      </section>
    </div>
  )
}
