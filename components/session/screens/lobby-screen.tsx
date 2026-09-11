"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ApertureIcon, CheckIcon, ChevronRightIcon, PencilLineIcon, QrCodeIcon, SparklesIcon, Undo2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PREMIUM_PRICE_LABEL } from "@/lib/content/pricing"
import { stripNamesOf } from "@/lib/session/room-state"
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
  // Nama panggilan yang benar-benar diisi (bukan "Kamu"/"Dia" bawaan).
  const myNick = s.snapshot?.participants.find((p) => p.id === s.participantId)?.nickname ?? null
  const bothNames = stripNamesOf(s.snapshot)
  const filterCss = getFilter(s.filterId).css
  const both = partner?.ready && s.me.ready

  const partnerLabel = partner?.name ?? "Dia"

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

      <NameHint
        myNick={myNick}
        partnerName={partner?.joined ? (partner.name ?? "Dia") : null}
        bothNames={bothNames}
        onEdit={() => setEditingName(true)}
      />

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
          {s.needsPremium ? (
            // Sesi premium (kuota gratis habis) belum dibayar: Siap terkunci,
            // aksi utamanya bayar. Siapa pun dari berdua boleh membayar.
            <>
              <p className="flex items-start gap-2 px-1 pt-0.5 text-caption text-soft-foreground">
                <SparklesIcon aria-hidden className="mt-px size-3.5 shrink-0 text-flash" />
                <span>
                  Sesi premium: bayar {PREMIUM_PRICE_LABEL} sekali untuk berdua, lalu tombol Siap terbuka.
                </span>
              </p>
              <Button onClick={s.openPaywall}>
                <QrCodeIcon data-icon="inline-start" />
                Bayar {PREMIUM_PRICE_LABEL}
              </Button>
            </>
          ) : s.me.ready ? (
            // Sudah siap: tunjukkan yang ditunggu, dan jelas bisa dibatalkan.
            <>
              <p
                aria-live="polite"
                className="flex min-h-8 items-center justify-center gap-2 rounded-full bg-sunken px-3 text-caption text-soft-foreground"
              >
                <span aria-hidden className="relative inline-flex size-2">
                  <span className="absolute inset-0 animate-ping-ring rounded-full bg-ok" />
                  <span className="relative size-2 rounded-full bg-ok" />
                </span>
                {both ? "Dua-duanya siap, mulai…" : `Kamu siap. Nunggu ${partnerLabel} tekan siap…`}
              </p>
              <Button variant="secondary" onClick={s.toggleReady} aria-pressed disabled={!!both}>
                <Undo2Icon data-icon="inline-start" />
                Batal siap
              </Button>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <ReadyChip ready={false} label="Kamu belum siap" />
                <ReadyChip ready={!!partner?.ready} label={`${partnerLabel} ${partner?.ready ? "siap" : "belum siap"}`} />
              </div>
              <Button onClick={s.toggleReady} aria-pressed={false}>
                <CheckIcon data-icon="inline-start" />
                {partner?.joined ? "Siap!" : "Nunggu dia masuk…"}
              </Button>
              <span className="sr-only" aria-live="polite">
                {partner?.ready ? `${partnerLabel} sudah siap, tinggal kamu` : "Kalian berdua harus tekan siap"}
              </span>
            </>
          )}
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

// Nama panggilan opsional: kalau dua-duanya diisi, nama berdua tampil di
// template Polaroid & link yang dibagikan.
function NameHint({
  myNick,
  partnerName,
  bothNames,
  onEdit,
}: {
  myNick: string | null
  partnerName: string | null
  bothNames: string | null
  onEdit: () => void
}) {
  const title = bothNames
    ? `${bothNames} tampil di photostrip`
    : myNick
      ? `Nama kamu: ${myNick}`
      : "Tulis nama panggilan kamu"
  const body = bothNames
    ? "Muncul di template Polaroid dan di link yang dibagikan. Ketuk untuk ubah namamu."
    : myNick
      ? `Tinggal ${partnerName ?? "dia"} isi namanya, biar nama kalian berdua tampil di template Polaroid & link yang dibagikan.`
      : "Kalau kalian berdua isi, namanya tampil di template Polaroid dan di link yang dibagikan. Opsional."

  return (
    <button
      type="button"
      onClick={onEdit}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-md border-[1.5px] px-3.5 py-3 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
        bothNames ? "border-transparent bg-card" : "border-dashed border-kabin-line hover:border-kabin-soft/50"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full",
          bothNames ? "bg-ok/20 text-ok" : "bg-card text-flash"
        )}
      >
        {bothNames ? <CheckIcon className="size-4" strokeWidth={2.5} /> : <PencilLineIcon className="size-4" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-small font-semibold">{title}</span>
        <span className="text-caption text-muted-foreground">{body}</span>
      </span>
      <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-faint-foreground" />
    </button>
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
