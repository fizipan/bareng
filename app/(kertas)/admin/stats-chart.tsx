"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { jam, longDate, niceMax, rupiah, shortDate, weekday } from "./stats-format"

export type DailyRow = { day: string; rooms: number; captured: number; paid: number }
export type HourRow = { h: number; rooms: number }

// Baris keterangan di atas grafik: isinya ikut batang yang lagi disentuh.
// Lebih tenang daripada tooltip melayang, dan jalan di layar sentuh.
function Readout({ children }: { children: React.ReactNode }) {
  return (
    <p aria-live="polite" className="flex min-h-6 flex-wrap items-baseline gap-x-2.5 gap-y-1 text-small">
      {children}
    </p>
  )
}

function Dot({ className }: { className: string }) {
  return <span aria-hidden className={cn("mr-1.5 inline-block size-2.5 rounded-[3px] align-[-1px]", className)} />
}

// Room per hari. Dua tampilan: sesi (room + photostrip di dalamnya) dan
// pendapatan. Sorot batang mana pun untuk melihat angka hari itu.
export function DailyChart({ daily }: { daily: DailyRow[] }) {
  const [money, setMoney] = useState(false)
  const [at, setAt] = useState<number | null>(null)
  const last = daily.length - 1
  const week = daily.length <= 7
  const value = (d: DailyRow) => (money ? d.paid : d.rooms)
  const top = niceMax(Math.max(...daily.map(value), 1))
  const row = daily[at ?? last]
  const label = (n: number) => (money ? rupiah(n) : String(n))

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Readout>
          <span className="font-semibold">
            {at == null ? "Hari ini" : longDate(row.day)}
            {at == null && <span className="ml-1.5 font-normal text-muted-foreground">{shortDate(row.day)}</span>}
          </span>
          <span className="tabular-nums text-soft-foreground">
            <Dot className="bg-card ring-1 ring-line-strong ring-inset" />
            {row.rooms} room
          </span>
          <span className="tabular-nums text-soft-foreground">
            <Dot className="bg-foreground/80" />
            {row.captured} photostrip
          </span>
          {(money || row.paid > 0) && <span className="font-semibold tabular-nums text-ok">{rupiah(row.paid)}</span>}
        </Readout>
        <div className="flex gap-1 rounded-full bg-card p-1">
          {[
            ["Sesi", false],
            ["Pendapatan", true],
          ].map(([text, on]) => (
            <button
              key={String(text)}
              type="button"
              onClick={() => setMoney(on as boolean)}
              aria-pressed={money === on}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1 text-caption font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                money === on ? "bg-sunken text-foreground shadow-[0_1px_0_rgb(22_20_29/0.06)]" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {text as string}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5">
        <div aria-hidden className="flex h-36 flex-col justify-between text-right text-[11px] leading-none text-muted-foreground tabular-nums">
          <span>{label(top)}</span>
          <span>{label(top / 2)}</span>
          <span>0</span>
        </div>
        <div className="relative h-36">
          {[0, 50, 100].map((y) => (
            <span key={y} aria-hidden className="absolute inset-x-0 border-t border-dashed border-line" style={{ top: `${y}%` }} />
          ))}
          <div className={cn("absolute inset-0 flex items-end", week ? "gap-2" : "gap-[3px]")} onMouseLeave={() => setAt(null)}>
            {daily.map((day, i) => (
              <button
                key={day.day}
                type="button"
                onMouseEnter={() => setAt(i)}
                onFocus={() => setAt(i)}
                onBlur={() => setAt(null)}
                aria-label={`${shortDate(day.day)}: ${day.rooms} room, ${day.captured} photostrip, ${rupiah(day.paid)}`}
                className="group relative flex h-full flex-1 cursor-pointer items-end outline-none"
              >
                <span
                  aria-hidden
                  className={cn(
                    "relative w-full rounded-t-[3px] transition-colors",
                    money ? "bg-ok" : "bg-card",
                    i === last && !money && "ring-1 ring-line-strong ring-inset",
                    at === i && "bg-flash",
                    "group-focus-visible:ring-2 group-focus-visible:ring-ring/60"
                  )}
                  style={{ height: `${value(day) ? Math.max(3, (value(day) / top) * 100) : 0}%` }}
                >
                  {!money && (
                    <span
                      className="absolute inset-x-0 bottom-0 rounded-t-[3px] bg-foreground/80"
                      style={{ height: `${day.rooms ? Math.min(100, (day.captured / day.rooms) * 100) : 0}%` }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
        <span />
        {week ? (
          <div aria-hidden className="mt-2 flex gap-2 text-[11px] text-muted-foreground">
            {daily.map((day, i) => (
              <span key={day.day} className={cn("flex-1 text-center whitespace-nowrap", i === (at ?? last) && "font-semibold text-foreground")}>
                {i === last ? "Hari ini" : weekday(day.day)}
              </span>
            ))}
          </div>
        ) : (
          <div aria-hidden className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>{shortDate(daily[0].day)}</span>
            <span>{shortDate(daily[Math.floor(last / 2)].day)}</span>
            <span className="font-semibold text-foreground">Hari ini</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Jam berapa orang foto (WIB). Berguna untuk memilih waktu rilis fitur atau
// jadwal perawatan.
export function HourBars({ hours }: { hours: HourRow[] }) {
  const [at, setAt] = useState<number | null>(null)
  const total = hours.reduce((n, x) => n + x.rooms, 0)
  const top = Math.max(...hours.map((x) => x.rooms), 1)
  const busiest = hours.reduce((a, b) => (b.rooms > a.rooms ? b : a), hours[0])
  const row = at == null ? busiest : hours[at]

  if (total === 0) return <p className="py-6 text-center text-small text-muted-foreground">Belum ada room di rentang ini.</p>

  return (
    <div className="flex flex-col gap-3.5">
      <Readout>
        <span className="font-semibold">
          {at == null && "Paling ramai "}
          {jam(row.h)}.00–{jam((row.h + 1) % 24)}.00
        </span>
        <span className="tabular-nums text-soft-foreground">
          {row.rooms} room{total > 0 && row.rooms > 0 && ` · ${Math.round((row.rooms / total) * 100)}% dari semua`}
        </span>
      </Readout>

      <div className="flex h-24 items-end gap-[3px]" onMouseLeave={() => setAt(null)}>
        {hours.map((h, i) => (
          <button
            key={h.h}
            type="button"
            onMouseEnter={() => setAt(i)}
            onFocus={() => setAt(i)}
            onBlur={() => setAt(null)}
            aria-label={`Jam ${jam(h.h)}: ${h.rooms} room`}
            className="group flex h-full flex-1 cursor-pointer items-end outline-none"
          >
            <span
              aria-hidden
              className={cn(
                "w-full rounded-t-[3px] transition-colors",
                h.rooms === 0 ? "bg-card" : "bg-foreground/80",
                at === i && "bg-flash",
                "group-focus-visible:ring-2 group-focus-visible:ring-ring/60"
              )}
              style={{ height: `${h.rooms ? Math.max(4, (h.rooms / top) * 100) : 2}%` }}
            />
          </button>
        ))}
      </div>
      <div aria-hidden className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
        {[0, 6, 12, 18, 23].map((h) => (
          <span key={h}>{jam(h)}</span>
        ))}
      </div>
    </div>
  )
}
