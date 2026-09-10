"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckIcon, Volume2Icon, VolumeXIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getFilter } from "@/lib/templates/filters"
import { getTemplate } from "@/lib/templates/builtin"
import { LIVE_A, LIVE_B } from "@/lib/templates/placeholder"
import { cn } from "@/lib/utils"
import { useSession } from "@/stores/session"
import { BackButton } from "../back-button"
import { ConnectionPill } from "../connection-pill"
import { FilterChips } from "../filter-chips"
import { NicknameDialog } from "../nickname-dialog"
import { TemplatePicker } from "../template-picker"
import { VideoTile } from "../video-tile"

// Layar Lobby (prototipe baris 516–605): preview berdua, template, filter, siap.
export function LobbyScreen() {
  const router = useRouter()
  const s = useSession()
  const [editingName, setEditingName] = useState(false)
  const partner = s.partner
  const filterCss = getFilter(s.filterId).css
  const both = partner?.ready && s.me.ready

  const readyLabel = s.me.ready ? "Nunggu dia siap…" : partner?.joined ? "Siap!" : "Nunggu dia masuk…"
  const readyHint = both
    ? "Dua-duanya siap, mulai…"
    : s.me.ready
      ? "Nunggu dia tekan siap"
      : "Kalian berdua harus tekan siap"

  // Tile kiri selalu host, kanan tamu — sama dengan urutan di strip.
  const mine = { name: s.me.name, placeholder: "feed kamera kamu", mine: true }
  const theirs = { name: partner?.name ?? "Dia", placeholder: "feed kamera dia", waiting: !partner?.joined }
  const tiles = (s.role === "host" ? [mine, theirs] : [theirs, mine]).map((t, i) => ({ ...t, bg: i === 0 ? LIVE_A : LIVE_B }))

  return (
    <div className="flex flex-col gap-[18px] px-5 pt-3 pb-8">
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
          <Button
            variant="secondary"
            size="sm"
            aria-pressed={s.sound}
            onClick={s.toggleSound}
            className={cn(
              "h-auto min-h-[34px] gap-2 rounded-full px-[13px] py-1.5 text-caption font-normal",
              !s.sound && "text-faint-foreground"
            )}
          >
            {s.sound ? <Volume2Icon className="size-[15px]" /> : <VolumeXIcon className="size-[15px] text-shutter" />}
            {s.sound ? "Suara nyala" : "Suara mati"}
          </Button>
        </div>
        <div className="flex gap-2.5 rounded-md border-[1.5px] border-darkroom-2 bg-background p-2.5">
          {tiles.map((t, i) => (
            <VideoTile
              key={i}
              name={t.name}
              state={"waiting" in t && t.waiting ? "waiting" : "live"}
              placeholder={t.placeholder}
              background={t.bg}
              filter={filterCss}
              onEditName={"mine" in t ? () => setEditingName(true) : undefined}
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

      <section className="flex flex-col gap-3 rounded-md bg-card p-3.5">
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
        <span className="text-center text-caption text-faint-foreground" aria-live="polite">
          {readyHint}
        </span>
      </section>

      {editingName && (
        <NicknameDialog open current={s.me.name} onOpenChange={setEditingName} onSave={s.setNickname} />
      )}
    </div>
  )
}

function ReadyChip({ ready, label }: { ready: boolean; label: string }) {
  return (
    <span className="inline-flex flex-1 items-center gap-[7px] rounded-full bg-sunken px-3 py-[9px] text-caption text-soft-foreground">
      <span aria-hidden className={cn("size-[7px] rounded-full", ready ? "bg-ok" : "bg-grain")} />
      {label}
    </span>
  )
}
