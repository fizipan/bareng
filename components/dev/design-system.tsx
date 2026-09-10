"use client"

import { useState } from "react"
import { CameraIcon, CopyIcon, DownloadIcon, MessageCircleIcon } from "lucide-react"
import { Logo, LogoMark } from "@/components/brand/logo"
import { StatusPill } from "@/components/brand/status-pill"
import { RoomCodeInput } from "@/components/session/room-code-input"
import { Button } from "@/components/ui/button"
import { notify } from "@/lib/toast"
import { cn } from "@/lib/utils"

const SWATCHES = [
  ["darkroom", "bg-darkroom"],
  ["darkroom-2", "bg-darkroom-2"],
  ["kertas", "bg-kertas"],
  ["kertas-2", "bg-kertas-2"],
  ["shutter", "bg-shutter"],
  ["flash", "bg-flash"],
  ["grain", "bg-grain"],
  ["ok", "bg-ok"],
] as const

function Panel({ mode }: { mode: "kertas" | "kabin" }) {
  const [code, setCode] = useState("")
  return (
    <section
      className={cn(
        mode,
        "flex flex-col gap-8 rounded-xl border bg-background p-6 text-foreground"
      )}
    >
      <div className="flex items-center justify-between">
        <Logo tagline="photobooth berdua" />
        <StatusPill tone="ok">{mode === "kabin" ? "Mode Kabin" : "Mode Kertas"}</StatusPill>
      </div>

      <div className="flex flex-col gap-3">
        <span className="font-display text-display-xl font-extrabold text-flash">3</span>
        <h1 className="font-display text-hero font-extrabold tracking-[-0.01em]">
          Foto bareng, walau jauh.
        </h1>
        <h2 className="font-display text-display-md font-semibold">Kirim link ini ke dia</h2>
        <p className="max-w-[34ch] text-body text-soft-foreground">
          Photobooth online untuk kamu dan dia. Buka link, hitung mundur bareng, jadi.
        </p>
        <p className="text-small text-muted-foreground">Teks sekunder small · 14 px</p>
        <p className="text-caption text-faint-foreground">Caption · status koneksi, hint</p>
      </div>

      <div className="flex flex-col gap-2.5">
        <Button>
          <CameraIcon data-icon="inline-start" />
          Izinkan kamera
        </Button>
        <Button variant="secondary">
          <CopyIcon data-icon="inline-start" />
          Salin link
        </Button>
        <Button variant="soft">
          <MessageCircleIcon data-icon="inline-start" />
          Kirim lewat WhatsApp
        </Button>
        <Button disabled>
          <DownloadIcon data-icon="inline-start" />
          Unduh photostrip
        </Button>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm">
            Nanti dulu
          </Button>
          <Button variant="link" size="inline">
            Baca halaman privasi
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center py-3">
        <Button variant="shutter" size="shutter" aria-label="Ambil foto sekarang" />
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusPill tone="ok">Tersambung</StatusPill>
        <StatusPill tone="lambat">Sinyal lagi lemot</StatusPill>
        <StatusPill tone="putus">Terputus — mencoba lagi (2/3)</StatusPill>
      </div>

      <div className="flex flex-col gap-3 rounded-md bg-card p-4">
        <span className="text-caption text-faint-foreground">Kode room</span>
        <div className="flex justify-center gap-[7px]">
          {"K7M2QX".split("").map((ch, i) => (
            <span
              key={i}
              className="flex h-[54px] w-[42px] items-center justify-center rounded-sm bg-background font-display text-[26px] font-semibold tracking-code"
            >
              {ch}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-small font-semibold">Masukin kode dari dia</span>
        <RoomCodeInput value={code} onChange={setCode} />
      </div>

      <Button variant="secondary" onClick={() => notify("Link disalin")}>
        Tes toast
      </Button>
    </section>
  )
}

export function DesignSystem() {
  return (
    <main className="mx-auto flex w-full max-w-[1040px] flex-col gap-8 px-5 py-10">
      <div className="flex items-center gap-3">
        <LogoMark size={28} />
        <h1 className="font-display text-display-md font-extrabold">Design system</h1>
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
        {SWATCHES.map(([name, bg]) => (
          <div key={name} className="flex flex-col gap-1.5">
            <span className={cn("h-14 rounded-sm border", bg)} />
            <span className="text-caption text-muted-foreground">{name}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel mode="kertas" />
        <Panel mode="kabin" />
      </div>
    </main>
  )
}
