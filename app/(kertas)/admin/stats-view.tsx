import { ChartNoAxesColumnIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type AdminStats = {
  days: number
  funnel: { rooms: number; guest: number; camera: number; connected: number; captured: number; saved: number; paywall: number; paid: number }
  drift: { n: number; p50: number | null; p95: number | null; under150: number | null }
  rtc: { connected: number; failed: number; p50_ms: number | null; relay_pct: number | null }
  payments: { count: number; total: number }
  daily: { day: string; rooms: number; captured: number }[]
}

const pct = (n: number, of: number) => (of > 0 ? Math.round((n / of) * 100) : 0)
const rupiah = (n: number) => `Rp${new Intl.NumberFormat("id-ID").format(n)}`
const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`))

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border-[1.5px] border-line bg-sunken p-4">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="font-display text-display-sm font-bold tabular-nums">{value}</span>
      {sub && <span className="text-caption text-soft-foreground">{sub}</span>}
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className={cn("text-title font-semibold tabular-nums", tone === "ok" && "text-ok", tone === "warn" && "text-shutter")}>{value}</span>
    </div>
  )
}

function Panel({ title, note, children, className }: { title: string; note?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-4 rounded-md border-[1.5px] border-line bg-sunken p-4 @xl:p-5", className)}>
      <div className="flex flex-col gap-0.5">
        <h2 className="text-label font-semibold">{title}</h2>
        {note && <p className="text-caption text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  )
}

// Tab Statistik /admin: funnel sesi, jepret serentak, koneksi video,
// pembayaran, dan sesi per hari. Angka dari tabel `events` (catatan teknis).
export function StatsView({ stats }: { stats: AdminStats }) {
  const f = stats.funnel
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
  const max = Math.max(1, ...stats.daily.map((d) => d.rooms))
  const d = stats.drift
  const r = stats.rtc

  return (
    <div className="@container flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-4">
        <Kpi label="Room dibuat" value={String(f.rooms)} sub={`${stats.days} hari terakhir`} />
        <Kpi label="Photostrip jadi" value={String(f.captured)} sub={`${pct(f.captured, f.rooms)}% dari room`} />
        <Kpi label="Video tersambung" value={`${pct(f.connected, f.guest)}%`} sub={`${f.connected} dari ${f.guest} room berdua`} />
        <Kpi label="Pembayaran" value={String(stats.payments.count)} sub={rupiah(stats.payments.total)} />
      </div>

      <Panel title="Perjalanan sesi" note={`Dari ${f.rooms} room yang dibuat dalam ${stats.days} hari terakhir.`}>
        <ol className="flex flex-col gap-3.5">
          {steps.map(([label, n]) => (
            <li key={label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
              <span className="text-small">{label}</span>
              <span className="text-small tabular-nums">
                <span className="font-semibold">{n}</span>
                <span className="ml-2 inline-block w-10 text-right text-muted-foreground">{pct(n, f.rooms)}%</span>
              </span>
              <span aria-hidden className="col-span-2 h-2 overflow-hidden rounded-full bg-card">
                <span className="block h-full rounded-full bg-foreground/80" style={{ width: `${pct(n, f.rooms)}%` }} />
              </span>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid gap-3 @2xl:grid-cols-2">
        <Panel title="Jepret serentak" note="Selisih waktu jepret dua HP per foto. Target: di bawah 150 ms.">
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Median" value={d.p50 == null ? "–" : `${d.p50} ms`} />
            <Metric label="95% foto" value={d.p95 == null ? "–" : `${d.p95} ms`} />
            <Metric
              label="Di bawah 150 ms"
              value={d.under150 == null ? "–" : `${d.under150}%`}
              tone={d.under150 == null ? undefined : d.under150 >= 95 ? "ok" : "warn"}
            />
          </div>
          <span className="text-caption text-muted-foreground">Dari {d.n} foto.</span>
        </Panel>
        <Panel title="Koneksi video" note="Waktu dari mulai menyambung sampai video dia muncul.">
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Median" value={r.p50_ms == null ? "–" : `${(r.p50_ms / 1000).toFixed(1)} dtk`} />
            <Metric label="Lewat TURN" value={r.relay_pct == null ? "–" : `${r.relay_pct}%`} />
            <Metric label="Gagal" value={String(r.failed)} tone={r.failed > 0 ? "warn" : undefined} />
          </div>
          <span className="text-caption text-muted-foreground">Dari {r.connected} sambungan.</span>
        </Panel>
      </div>

      <Panel title="Room per hari" note="Batang terang: room dibuat. Batang gelap: photostrip jadi.">
        <div className="flex h-32 items-end gap-[3px]" role="img" aria-label="Grafik room per hari">
          {stats.daily.map((day) => (
            <div
              key={day.day}
              title={`${dayLabel(day.day)}: ${day.rooms} room, ${day.captured} photostrip`}
              className="relative flex-1 rounded-t-[3px] bg-card"
              style={{ height: `${Math.max(day.rooms ? 4 : 2, (day.rooms / max) * 100)}%` }}
            >
              <span
                className="absolute inset-x-0 bottom-0 rounded-t-[3px] bg-foreground/80"
                style={{ height: `${day.rooms ? Math.min(100, (day.captured / day.rooms) * 100) : 0}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-caption text-muted-foreground">
          <span>{stats.daily[0] ? dayLabel(stats.daily[0].day) : ""}</span>
          <span>Hari ini</span>
        </div>
      </Panel>

      <p className="text-caption text-muted-foreground">
        Termasuk sesi uji otomatis. Perangkat demo tidak dihitung. Tanpa data pribadi: tanpa nama, IP, atau email.
      </p>
    </div>
  )
}
