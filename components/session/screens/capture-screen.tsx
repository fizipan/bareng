"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { FrameFill } from "@/components/strip/frame-fill"
import { Strip } from "@/components/strip/strip"
import { Button } from "@/components/ui/button"
import { SITE_HOST } from "@/lib/brand"
import { formatStripDate } from "@/lib/format"
import { getFilter } from "@/lib/templates/filters"
import { getTemplate } from "@/lib/templates/builtin"
import { LIVE_A, LIVE_B } from "@/lib/templates/placeholder"
import type { StripTemplate } from "@/lib/templates/schema"
import type { Frame, Role } from "@/lib/session/types"
import { cn } from "@/lib/utils"
import { useMedia } from "@/stores/media"
import { useSession } from "@/stores/session"
import { ConnectionPill } from "../connection-pill"
import { LiveVideo } from "../live-video"

// Layar Capture (prototipe baris 607–691). Foto diambil langsung di dalam
// template: slot aktif menyala merah berisi feed kamu & dia, slot yang sudah
// jadi terisi foto, sisanya bernomor. Proporsi slot sama persis dengan hasil
// akhir, jadi yang terlihat di sini = crop di photostrip.
export function CaptureScreen() {
  const s = useSession()
  const local = useMedia((m) => m.local)
  const remote = useMedia((m) => m.remote)
  const template = getTemplate(s.templateId)
  const filterCss = getFilter(s.filterId).css
  const { idx, phase, count, prompt } = s.shot

  const hint =
    phase === "prompt"
      ? "Ketuk buat mulai hitung mundur"
      : phase === "count"
        ? "Tahan pose…"
        : phase === "idle"
          ? "Siap-siap…"
          : "Menyimpan foto…"

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center gap-4 px-5 pt-3 pb-7 text-center">
      <div className="flex w-full items-center justify-between gap-2.5">
        <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-[7px] text-caption text-soft-foreground">
          Foto
          <span className="font-display text-small font-semibold text-foreground">{idx + 1}</span>
          dari 4
        </span>
        <ConnectionPill conn={s.conn} attempt={s.reconnectAttempt} />
      </div>

      <StripWindow
        template={template}
        frames={s.frames}
        activeIdx={idx}
        role={s.role}
        local={local}
        remote={remote}
        filterCss={filterCss}
        counting={phase === "count"}
        count={count}
      />

      {phase === "prompt" && (
        <div className="flex w-full animate-fade-in items-center justify-between gap-3 rounded-md bg-card py-2 pr-2 pl-4 text-left">
          <span className="font-display text-title font-semibold" aria-live="polite">
            {prompt}
          </span>
          <Button variant="ghost" size="sm" onClick={s.skipPrompt}>
            Lewati
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2" aria-hidden>
        {s.frames.map((f, i) => (
          <FrameChip key={i} frame={f} index={i} active={!f && i === idx} filterCss={filterCss} />
        ))}
      </div>

      <div className="flex h-[92px] items-center justify-center">
        {phase === "prompt" ? (
          <Button variant="shutter" size="shutter" aria-label="Ambil foto sekarang" onClick={s.skipPrompt} />
        ) : (
          <span className="flex gap-2" aria-hidden>
            <span className="size-2.5 animate-[blink_1.1s_ease-in-out_infinite] rounded-full bg-shutter" />
            <span className="size-2.5 animate-[blink_1.1s_ease-in-out_.15s_infinite] rounded-full bg-grain" />
            <span className="size-2.5 animate-[blink_1.1s_ease-in-out_.3s_infinite] rounded-full bg-grain" />
          </span>
        )}
      </div>
      <span className="text-caption text-faint-foreground" aria-live="polite">
        {hint}
      </span>
    </div>
  )
}

const STRIP_WIDTH = "min(100%, 300px)"

// Jendela strip: kalau strip lebih tinggi dari ruang yang ada, strip bergeser
// supaya slot aktif selalu di tengah — seperti kertas lewat di dalam mesin.
function StripWindow({
  template,
  frames,
  activeIdx,
  role,
  local,
  remote,
  filterCss,
  counting,
  count,
}: {
  template: StripTemplate
  frames: (Frame | null)[]
  activeIdx: number
  role: Role
  local: MediaStream | null
  remote: MediaStream | null
  filterCss: string
  counting: boolean
  count: number
}) {
  const windowRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState({ offset: 0, clipTop: false, clipBottom: false, activeCenter: 0 })

  useLayoutEffect(() => {
    const win = windowRef.current
    const strip = stripRef.current
    if (!win || !strip) return
    const update = () => {
      const vh = win.clientHeight
      const sh = strip.offsetHeight
      const slot = template.slots[activeIdx]
      const center = ((slot.y + slot.h / 2) / template.canvas.height) * sh
      if (sh <= vh) {
        const offset = (vh - sh) / 2
        setLayout({ offset, clipTop: false, clipBottom: false, activeCenter: offset + center })
        return
      }
      const offset = Math.min(0, Math.max(vh - sh, vh / 2 - center))
      setLayout({ offset, clipTop: offset < -1, clipBottom: offset + sh > vh + 1, activeCenter: offset + center })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(win)
    ro.observe(strip)
    return () => ro.disconnect()
  }, [template, activeIdx])

  const tokens = { date: formatStripDate(new Date()), host: SITE_HOST }
  const labels = role === "host" ? { a: "kamu", b: "dia" } : { a: "dia", b: "kamu" }
  // Setengah A = host, B = tamu (urutan strip sama di dua HP).
  const feeds = role === "host" ? { a: local, b: remote } : { a: remote, b: local }

  return (
    <div
      ref={windowRef}
      className="relative min-h-[200px] w-full flex-1 overflow-hidden"
      style={{
        // Fade hanya di sisi yang benar-benar terpotong.
        maskImage: `linear-gradient(${layout.clipTop ? "transparent, #000 28px" : "#000, #000"}, ${layout.clipBottom ? "#000 calc(100% - 28px), transparent" : "#000"})`,
      }}
    >
      <div
        ref={stripRef}
        className="absolute top-0 left-1/2 transition-transform duration-500 ease-strip"
        style={{ width: STRIP_WIDTH, transform: `translate(-50%, ${layout.offset}px)` }}
      >
        <Strip
          template={template}
          tokens={tokens}
          shadow="strip-dark"
          renderHalf={(i, side) => {
            const f = frames[i]
            if (f) return <FrameFill source={f[side]} side={side} />
            if (i !== activeIdx) return null
            const stream = feeds[side]
            return (
              <div className="absolute inset-0" style={{ background: side === "a" ? LIVE_A : LIVE_B }}>
                {stream && <LiveVideo stream={stream} feed={stream === local ? "local" : "remote"} />}
                <span className="absolute bottom-1 left-1.5 rounded-[3px] bg-darkroom/50 px-1 font-mono text-[9px] text-[#C9C6D4]">
                  {labels[side]}
                </span>
              </div>
            )
          }}
          filter={filterCss}
          slotClassName={(i) => (!frames[i] && i === activeIdx ? "outline-2 outline-shutter" : undefined)}
          renderSlot={(i) =>
            !frames[i] && i !== activeIdx ? (
              <span className="absolute inset-0 flex items-center justify-center font-display text-base font-semibold text-[#4A4658]">
                {i + 1}
              </span>
            ) : null
          }
        />
      </div>
      {counting && (
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 bg-darkroom/55" style={{ width: STRIP_WIDTH }}>
          {/* Angka tepat di tengah slot yang sedang diambil. */}
          <span
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 transition-[top] duration-500 ease-strip"
            style={{ top: layout.activeCenter }}
          >
            <span key={count} className="block animate-tick font-display text-display-xl font-extrabold text-flash" aria-live="assertive">
              {count}
            </span>
          </span>
        </div>
      )}
    </div>
  )
}


function FrameChip({
  frame,
  index,
  active,
  filterCss,
}: {
  frame: Frame | null
  index: number
  active: boolean
  filterCss: string
}) {
  return (
    <div
      className={cn(
        "relative flex h-[34px] w-[46px] gap-[1.5px] overflow-hidden rounded-sm border-[1.5px] bg-sunken",
        frame ? "border-solid" : "border-dashed",
        active ? "border-shutter" : "border-outline"
      )}
    >
      {frame && (
        <>
          <div className="relative flex-1" style={{ filter: filterCss === "none" ? undefined : filterCss }}>
            <FrameFill source={frame.a} side="a" />
          </div>
          <div className="relative flex-1" style={{ filter: filterCss === "none" ? undefined : filterCss }}>
            <FrameFill source={frame.b} side="b" />
          </div>
        </>
      )}
      {!frame && (
        <span className="absolute inset-0 flex items-center justify-center font-display text-meta font-semibold text-[#5C5870]">
          {index + 1}
        </span>
      )}
    </div>
  )
}
