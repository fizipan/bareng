import {
  ArrowDownIcon,
  ArrowUpIcon,
  CameraIcon,
  ChartNoAxesColumnIcon,
  DoorOpenIcon,
  ImagesIcon,
  MicIcon,
  TrendingDownIcon,
  VideoIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DailyChart, HourBars, type DailyRow, type HourRow } from "./stats-chart"
import { durasi, pct, rupiah } from "./stats-format"

export type AdminStats = {
  days: number
  generated_at: number
  funnel: { rooms: number; guest: number; camera: number; connected: number; captured: number; saved: number; paywall: number; paid: number }
  prev: { rooms: number; guest: number; connected: number; captured: number; paid_total: number }
  drift: { n: number; p50: number | null; p95: number | null; under150: number | null }
  rtc: { connected: number; failed: number; p50_ms: number | null; relay_pct: number | null }
  payments: { count: number; total: number }
  speed: { n: number; p50: number | null; p90: number | null }
  perms: { cam_ok: number; cam_no: number; mic_try: number; mic_ok: number; mic_no: number; mic_lain: number }
  retake: { rooms: number; count: number }
  reach: { views: number; rooms: number }
  hours: HourRow[]
  daily: DailyRow[]
}

// Naik/turun dibanding periode sebelumnya (panjang sama).
function Delta({ now, before, days, points = false }: { now: number; before: number | null; days: number; points?: boolean }) {
  if (before == null || (!points && before === 0)) {
    return <span className="text-caption text-muted-foreground">Belum ada pembanding</span>
  }
  const d = points ? Math.round(now - before) : Math.round(((now - before) / before) * 100)
  const Icon = d > 0 ? ArrowUpIcon : ArrowDownIcon
  return (
    <span className="flex flex-wrap items-center gap-x-1.5 text-caption">
      <span className={cn("inline-flex items-center gap-0.5 font-semibold tabular-nums", d > 0 ? "text-ok" : d < 0 ? "text-shutter" : "text-muted-foreground")}>
        {d !== 0 && <Icon aria-hidden className="size-3" strokeWidth={2.5} />}
        {d === 0 ? "Sama" : `${Math.abs(d)}${points ? " poin" : "%"}`}
      </span>
      <span className="text-muted-foreground">vs {days} hari sebelumnya</span>
    </span>
  )
}

function Kpi({ icon: Icon, label, value, sub, delta }: { icon: LucideIcon; label: string; value: string; sub?: string; delta: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-md border-[1.5px] border-line bg-sunken p-4">
      <span className="flex items-center gap-2 text-caption font-semibold text-soft-foreground">
        <span aria-hidden className="grid size-7 place-items-center rounded-full bg-card">
          <Icon className="size-3.5" />
        </span>
        {label}
      </span>
      <span className="flex flex-col gap-1">
        <span className="font-display text-display-sm leading-none font-bold tabular-nums">{value}</span>
        {sub && <span className="text-caption text-soft-foreground">{sub}</span>}
      </span>
      <span className="mt-auto">{delta}</span>
    </div>
  )
}

function Panel({
  title,
  note,
  aside,
  children,
  className,
}: {
  title: string
  note?: string
  aside?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("flex flex-col gap-4 rounded-md border-[1.5px] border-line bg-sunken p-4 @xl:p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-label font-semibold">{title}</h2>
          {note && <p className="text-caption text-muted-foreground">{note}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}

type Health = "ok" | "warn" | "none"
const HEALTH: Record<Health, [string, string]> = {
  ok: ["Sehat", "bg-ok/15 text-ok"],
  warn: ["Perlu dicek", "bg-shutter/10 text-shutter"],
  none: ["Belum ada data", "bg-card text-muted-foreground"],
}

function HealthPill({ health }: { health: Health }) {
  const [label, className] = HEALTH[health]
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-semibold", className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}

// Angka utama + batang dengan penanda target.
function Gauge({ value, label, target, health }: { value: number | null; label: string; target: number; health: Health }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="flex items-baseline gap-2">
        <span className="font-display text-display-sm leading-none font-bold tabular-nums">{value == null ? "–" : `${value}%`}</span>
        <span className="text-small text-soft-foreground">{label}</span>
      </p>
      <div className="flex flex-col gap-1">
        <div className="relative h-2 rounded-full bg-card">
          <div
            className={cn("h-full rounded-full", health === "warn" ? "bg-shutter" : "bg-ok")}
            style={{ width: `${value ?? 0}%` }}
          />
          <span aria-hidden className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-foreground/60" style={{ left: `${target}%` }} />
        </div>
        <span className="self-end text-[11px] text-muted-foreground">Target {target}%</span>
      </div>
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className={cn("text-label font-semibold tabular-nums", tone === "warn" && "text-shutter")}>{value}</span>
    </div>
  )
}

// Satu baris proporsi: ikon, berapa persen berhasil, dan rinciannya.
function Share({ icon: Icon, label, ok, total, sub, warn }: { icon: LucideIcon; label: string; ok: number; total: number; sub: string; warn: boolean }) {
  const share = total > 0 ? pct(ok, total) : null
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2 text-small font-semibold">
          <Icon aria-hidden className="size-4 text-muted-foreground" />
          {label}
        </span>
        <span className="text-small tabular-nums">{share == null ? "–" : `${share}%`}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-card">
        <div className={cn("h-full rounded-full", warn ? "bg-shutter" : "bg-ok")} style={{ width: `${share ?? 0}%` }} />
      </div>
      <span className="text-caption text-muted-foreground">{sub}</span>
    </div>
  )
}

// Tab Statistik /admin: angka utama (dibanding periode sebelumnya), perjalanan
// sesi dengan titik berhenti terbanyak, kesehatan jepret & koneksi, room per
// hari, jam ramai, dan izin perangkat. Angka dari tabel `events` (catatan
// teknis tanpa data pribadi).
export function StatsView({ stats }: { stats: AdminStats }) {
  const f = stats.funnel
  const p = stats.prev
  if (f.rooms === 0 && stats.daily.every((d) => d.rooms === 0)) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border-[1.5px] border-dashed border-line px-5 py-14 text-center">
        <ChartNoAxesColumnIcon aria-hidden className="size-7 text-muted-foreground" />
        <span className="text-label font-semibold">Belum ada data di rentang ini</span>
        <span className="max-w-[44ch] text-small text-muted-foreground">
          Statistik mulai tercatat sejak 12 Sep 2026. Sesi dari perangkat demo tidak dihitung.
        </span>
      </div>
    )
  }

  const steps: [string, number][] = [
    ["Room dibuat", f.rooms],
    ["Dia ikut gabung", f.guest],
    ["Kamera diizinkan berdua", f.camera],
    ["Video tersambung", f.connected],
    ["Photostrip jadi", f.captured],
    ["Diunduh atau dibagikan", f.saved],
    ["Lihat paywall", f.paywall],
    ["Bayar premium", f.paid],
  ]
  // Titik berhenti terbanyak di alur inti (sampai unduh/bagikan); paywall
  // wajar tidak dilihat semua orang, jadi tidak ikut dinilai.
  let worst = 0
  let worstDrop = 0
  for (let i = 1; i < 6; i++) {
    const drop = steps[i - 1][1] - steps[i][1]
    if (drop > worstDrop) {
      worstDrop = drop
      worst = i
    }
  }

  const d = stats.drift
  const r = stats.rtc
  const perms = stats.perms
  const shotHealth: Health = d.n === 0 || d.under150 == null ? "none" : d.under150 >= 95 ? "ok" : "warn"
  const tries = r.connected + r.failed
  const linkRate = tries > 0 ? pct(r.connected, tries) : null
  const linkHealth: Health = linkRate == null ? "none" : linkRate >= 90 ? "ok" : "warn"
  const camTries = perms.cam_ok + perms.cam_no
  // Kamera wajib: menolak berarti sesi berhenti di situ. Mikrofon opsional,
  // jadi yang dinilai cuma kamera.
  const camHealth: Health = camTries === 0 ? "none" : pct(perms.cam_ok, camTries) >= 90 ? "ok" : "warn"

  return (
    <div className="@container flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">
        <Kpi
          icon={DoorOpenIcon}
          label="Room dibuat"
          value={String(f.rooms)}
          sub={`± ${(f.rooms / stats.days).toFixed(1).replace(".", ",").replace(",0", "")} per hari`}
          delta={<Delta now={f.rooms} before={p.rooms} days={stats.days} />}
        />
        <Kpi
          icon={ImagesIcon}
          label="Photostrip jadi"
          value={String(f.captured)}
          sub={`${pct(f.captured, f.rooms)}% dari room`}
          delta={<Delta now={f.captured} before={p.captured} days={stats.days} />}
        />
        <Kpi
          icon={VideoIcon}
          label="Video tersambung"
          value={`${pct(f.connected, f.guest)}%`}
          sub={`${f.connected} dari ${f.guest} room berdua`}
          delta={<Delta now={pct(f.connected, f.guest)} before={p.guest > 0 ? pct(p.connected, p.guest) : null} days={stats.days} points />}
        />
        <Kpi
          icon={WalletIcon}
          label="Pendapatan"
          value={rupiah(stats.payments.total)}
          sub={`${stats.payments.count} pembayaran`}
          delta={<Delta now={stats.payments.total} before={p.paid_total} days={stats.days} />}
        />
      </div>

      <Panel title="Perjalanan sesi" note={`${f.rooms} room yang dibuat dalam ${stats.days} hari terakhir, sampai mana saja.`}>
        {worst > 0 && (
          <p className="flex items-start gap-2.5 rounded-sm bg-shutter/8 px-3.5 py-2.5 text-small">
            <TrendingDownIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-shutter" />
            <span>
              Paling banyak berhenti sebelum <span className="font-semibold">{steps[worst][0].toLowerCase()}</span>: {worstDrop} room (
              {pct(worstDrop, f.rooms)}% dari semua room).
            </span>
          </p>
        )}
        <ol className="flex flex-col gap-3.5">
          {steps.map(([label, n], i) => (
            <li key={label} className="flex flex-col gap-3.5">
              {i === 6 && (
                <span aria-hidden className="border-t-[1.5px] border-dashed border-line pt-2 text-caption font-semibold text-muted-foreground">
                  Premium
                </span>
              )}
              <div className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1.5">
                <span className="text-caption text-muted-foreground tabular-nums">{i + 1}</span>
                <span className={cn("text-small", i === worst && "font-semibold")}>{label}</span>
                <span className="text-small tabular-nums">
                  <span className="font-semibold">{n}</span>
                  <span className="ml-2 inline-block w-10 text-right text-muted-foreground">{pct(n, f.rooms)}%</span>
                </span>
                <span aria-hidden className="col-span-2 col-start-2 h-2 overflow-hidden rounded-full bg-card">
                  <span
                    className={cn("block h-full rounded-full", i === worst ? "bg-shutter" : "bg-foreground/80")}
                    style={{ width: `${pct(n, f.rooms)}%` }}
                  />
                </span>
              </div>
            </li>
          ))}
        </ol>
        <div className="grid grid-cols-3 gap-3 border-t-[1.5px] border-line pt-3.5">
          <Metric label="Sesi selesai dalam" value={durasi(stats.speed.p50)} />
          <Metric
            label="Foto diulang"
            value={f.captured > 0 ? `${pct(stats.retake.rooms, f.captured)}% sesi` : "–"}
            tone={f.captured > 0 && pct(stats.retake.rooms, f.captured) > 40 ? "warn" : undefined}
          />
          <Metric
            label="Hasil dibuka"
            value={stats.reach.rooms > 0 ? `${(stats.reach.views / stats.reach.rooms).toFixed(1).replace(".", ",")}×` : "–"}
          />
        </div>
      </Panel>

      <div className="grid gap-3 @2xl:grid-cols-2">
        <Panel title="Jepret serentak" note="Selisih waktu jepret dua HP per foto." aside={<HealthPill health={shotHealth} />}>
          <Gauge value={d.under150} label="foto di bawah 150 ms" target={95} health={shotHealth} />
          <div className="grid grid-cols-3 gap-3 border-t-[1.5px] border-line pt-3.5">
            <Metric label="Median" value={d.p50 == null ? "–" : `${d.p50} ms`} />
            <Metric label="95% foto" value={d.p95 == null ? "–" : `${d.p95} ms`} />
            <Metric label="Foto" value={String(d.n)} />
          </div>
        </Panel>
        <Panel title="Koneksi video" note="Sampai video dia muncul di layar." aside={<HealthPill health={linkHealth} />}>
          <Gauge value={linkRate} label="berhasil tersambung" target={90} health={linkHealth} />
          <div className="grid grid-cols-3 gap-3 border-t-[1.5px] border-line pt-3.5">
            <Metric label="Median" value={r.p50_ms == null ? "–" : `${(r.p50_ms / 1000).toFixed(1).replace(".", ",")} dtk`} />
            <Metric label="Lewat TURN" value={r.relay_pct == null ? "–" : `${r.relay_pct}%`} />
            <Metric label="Gagal" value={String(r.failed)} tone={r.failed > 0 ? "warn" : undefined} />
          </div>
        </Panel>
      </div>

      <Panel title="Room per hari" note="Sorot batangnya untuk lihat angka hari itu.">
        <DailyChart daily={stats.daily} />
      </Panel>

      <div className="grid gap-3 @2xl:grid-cols-2">
        <Panel title="Jam ramai" note="Waktu room dibuat, WIB.">
          <HourBars hours={stats.hours} />
        </Panel>
        <Panel title="Izin perangkat" note="Kamera wajib; mikrofon boleh dilewati." aside={<HealthPill health={camHealth} />}>
          <div className="flex flex-col gap-4">
            <Share
              icon={CameraIcon}
              label="Kamera"
              ok={perms.cam_ok}
              total={camTries}
              sub={camTries === 0 ? "Belum ada percobaan" : `${perms.cam_no} peserta menolak dari ${camTries}`}
              warn={camHealth === "warn"}
            />
            <Share
              icon={MicIcon}
              label="Mikrofon"
              ok={perms.mic_ok}
              total={perms.mic_try}
              sub={
                perms.mic_try === 0
                  ? "Belum ada yang mencoba"
                  : `${perms.mic_no} ditolak · ${perms.mic_lain} gagal karena hal lain`
              }
              warn={perms.mic_try > 0 && pct(perms.mic_ok, perms.mic_try) < 60}
            />
          </div>
        </Panel>
      </div>

      <p className="text-caption text-muted-foreground">
        Termasuk sesi uji otomatis. Perangkat demo tidak dihitung. Tanpa data pribadi: tanpa nama, IP, atau email.
      </p>
    </div>
  )
}
