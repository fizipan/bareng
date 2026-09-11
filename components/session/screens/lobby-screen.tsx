"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ApertureIcon, CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getFilter } from "@/lib/templates/filters"
import { getTemplate } from "@/lib/templates/builtin"
import { LIVE_A, LIVE_B } from "@/lib/templates/placeholder"
import { notify, warn } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { media, useMedia } from "@/stores/media"
import { useSession } from "@/stores/session"
import { BackButton } from "../back-button"
import { ConnectionPill } from "../connection-pill"
import { FilterChips } from "../filter-chips"
import { MicSheet, useMicPermission, type MicStep } from "../mic-sheet"
import { NicknameDialog } from "../nickname-dialog"
import { TemplatePicker } from "../template-picker"
import { VideoTile } from "../video-tile"

// Layar Lobby (prototipe baris 516–605): preview berdua, template, filter, siap.
// Tombol siap menempel di bawah layar supaya nggak perlu scroll dulu.
export function LobbyScreen() {
  const router = useRouter()
  const s = useSession()
  const [editingName, setEditingName] = useState(false)
  const local = useMedia((m) => m.local)
  const remote = useMedia((m) => m.remote)
  const mic = useMedia((m) => m.mic)
  const micBusy = useMedia((m) => m.micBusy)
  // Galeri /dev/screens tidak punya room: tile memakai pola placeholder.
  const real = !!s.roomId
  const partner = s.partner
  const [demoMic, setDemoMic] = useState(false)
  const micPermission = useMicPermission(real)
  const [micStep, setMicStep] = useState<MicStep | null>(null)
  const closedWhileWaiting = useRef(false)

  // Klik "Izinkan mikrofon" (atau "coba lagi"): getUserMedia langsung dari klik.
  const allowMic = async () => {
    const retry = micStep === "denied"
    closedWhileWaiting.current = false
    setMicStep("waiting")
    const result = await media.setMic(true)
    if (closedWhileWaiting.current) {
      if (result !== "ok") warn("Mikrofon belum diizinkan")
      return
    }
    if (result === "ok") {
      setMicStep(null)
      notify(`Mic nyala, ${partner?.name ?? "dia"} bisa dengar kamu`)
      return
    }
    if (retry && result === "denied") warn("Masih diblokir. Cek lagi langkahnya ya")
    setMicStep(result)
  }

  const toggleMic = () => {
    if (!real) return setDemoMic((on) => !on)
    if (mic) return void media.setMic(false)
    // Sudah pernah dijawab (izin/blokir): langsung coba dari klik ini. Blokir
    // gagal seketika tanpa pop-up → lembar panduan. Belum pernah → penjelasan dulu.
    if (media.hasMicTrack() || micPermission === "granted" || micPermission === "denied") {
      void media.setMic(true).then((result) => result !== "ok" && setMicStep(result))
      return
    }
    setMicStep("ask")
  }

  const partnerMic = !!(partner?.id && s.mics[partner.id])
  const filterCss = getFilter(s.filterId).css
  const both = partner?.ready && s.me.ready

  const readyLabel = s.me.ready ? "Nunggu dia siap…" : partner?.joined ? "Siap!" : "Nunggu dia masuk…"
  const readyHint = both
    ? "Dua-duanya siap, mulai…"
    : s.me.ready
      ? "Nunggu dia tekan siap"
      : "Kalian berdua harus tekan siap"

  // Tile kiri selalu host, kanan tamu — sama dengan urutan di strip.
  const mine = {
    name: s.me.name,
    placeholder: "feed kamera kamu",
    mine: true,
    stream: local,
    feed: "local" as const,
    state: real && !local ? ("loading" as const) : ("live" as const),
    mic: { on: real ? mic : demoMic, busy: micBusy, onToggle: toggleMic },
  }
  const theirs = {
    name: partner?.name ?? "Dia",
    placeholder: "feed kamera dia",
    stream: remote,
    feed: "remote" as const,
    state: !partner?.joined ? ("waiting" as const) : real && !remote ? ("loading" as const) : ("live" as const),
    mic: { on: partnerMic },
  }
  const tiles = (s.role === "host" ? [mine, theirs] : [theirs, mine]).map((t, i) => ({ ...t, bg: i === 0 ? LIVE_A : LIVE_B }))

  return (
    <div className="flex flex-1 flex-col gap-[18px] px-5 pt-3">
      <div className="flex items-center justify-between gap-2.5">
        <span className="flex items-center gap-2">
          <BackButton
            size="icon-sm"
            label={s.role === "host" ? "Lihat link undangan" : "Keluar dari booth"}
            onClick={() => {
              if (s.role === "host") {
                s.backToInvite()
                return
              }
              s.leave()
              router.push("/")
            }}
          />
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-[7px] text-caption text-faint-foreground">
            Room
            <span className="font-display text-small font-semibold tracking-[0.1em] text-foreground">{s.code}</span>
          </span>
        </span>
        <ConnectionPill conn={s.conn} attempt={s.reconnectAttempt} />
      </div>

      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-small font-semibold">Begini nanti hasilnya</h2>
          <SoundSwitch on={s.sound} onToggle={s.toggleSound} />
        </div>
        <div className="flex gap-2.5 rounded-md border-[1.5px] border-darkroom-2 bg-background p-2.5">
          {tiles.map((t, i) => (
            <VideoTile
              key={i}
              name={t.name}
              state={t.state}
              stream={t.stream}
              feed={t.feed}
              placeholder={t.placeholder}
              background={t.bg}
              filter={filterCss}
              onEditName={"mine" in t ? () => setEditingName(true) : undefined}
              mic={t.mic}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-small font-semibold">Template</h2>
          <span className="text-caption text-faint-foreground">{getTemplate(s.templateId).name}</span>
        </div>
        <TemplatePicker value={s.templateId} onChange={s.setTemplate} />
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="text-small font-semibold">Filter</h2>
        <FilterChips value={s.filterId} onChange={s.setFilter} />
      </section>

      <div className="sticky bottom-0 z-10 -mx-5 mt-auto bg-linear-to-t from-background from-65% to-transparent px-5 pt-6 pb-[max(16px,env(safe-area-inset-bottom))]">
        <section
          aria-label="Siap foto"
          className="flex flex-col gap-2.5 rounded-md border border-kabin-line-2 bg-card p-2.5 shadow-[0_-8px_28px_rgb(0_0_0/0.4)]"
        >
          <div className="flex gap-2">
            <ReadyChip ready={s.me.ready} label={s.me.ready ? "Kamu siap" : "Kamu belum siap"} />
            <ReadyChip
              ready={!!partner?.ready}
              label={`${partner?.name ?? "Dia"} ${partner?.ready ? "siap" : "belum siap"}`}
            />
          </div>
          <Button onClick={s.toggleReady} aria-pressed={s.me.ready}>
            <CheckIcon data-icon="inline-start" />
            {readyLabel}
          </Button>
          <span className="sr-only" aria-live="polite">
            {readyHint}
          </span>
        </section>
      </div>

      <MicSheet
        step={micStep}
        onAllow={allowMic}
        onClose={() => {
          if (micStep === "waiting") closedWhileWaiting.current = true
          setMicStep(null)
        }}
      />

      {editingName && (
        <NicknameDialog open current={s.me.name} onOpenChange={setEditingName} onSave={s.setNickname} />
      )}
    </div>
  )
}

// Suara hitung mundur & shutter di HP ini (bukan mic). Menyalakan = contoh bunyi.
function SoundSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      title="Bunyi tik-tik hitung mundur dan cekrek saat foto diambil"
      className="inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-outline py-1 pr-1.5 pl-3 text-caption font-medium text-foreground outline-none transition-colors hover:bg-foreground/5 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <ApertureIcon aria-hidden className={cn("size-[15px] transition-colors", on ? "text-flash" : "text-faint-foreground")} />
      Suara shutter
      <span aria-hidden className={cn("relative h-5 w-9 rounded-full transition-colors", on ? "bg-ok" : "bg-kabin-line")}>
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-4 rounded-full bg-kertas shadow-[0_1px_2px_rgb(0_0_0/0.3)] transition-transform duration-200",
            on && "translate-x-4"
          )}
        />
      </span>
    </button>
  )
}

function ReadyChip({ ready, label }: { ready: boolean; label: string }) {
  return (
    <span className="inline-flex flex-1 items-center gap-[7px] rounded-full bg-sunken px-3 py-2 text-caption text-soft-foreground">
      <span aria-hidden className={cn("size-[7px] rounded-full", ready ? "bg-ok" : "bg-grain")} />
      {label}
    </span>
  )
}
