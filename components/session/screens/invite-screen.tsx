"use client"

import { useRouter } from "next/navigation"
import { CopyIcon } from "lucide-react"
import { LogoMark } from "@/components/brand/logo"
import { WhatsAppIcon } from "@/components/brand/whatsapp-icon"
import { WaitingPair } from "@/components/art/waiting-pair"
import { Button } from "@/components/ui/button"
import { SITE_HOST } from "@/lib/brand"
import { cn } from "@/lib/utils"
import { useSession } from "@/stores/session"
import { BackButton } from "../back-button"
import { ConnectionPill } from "../connection-pill"

// Layar Undang (prototipe baris 366–441).
export function InviteScreen() {
  const router = useRouter()
  const code = useSession((s) => s.code)
  const conn = useSession((s) => s.conn)
  const attempt = useSession((s) => s.reconnectAttempt)
  const partner = useSession((s) => s.partner)
  const leave = useSession((s) => s.leave)
  const closeInvite = useSession((s) => s.closeInvite)
  const copyInviteLink = useSession((s) => s.copyInviteLink)
  const shareWhatsApp = useSession((s) => s.shareWhatsApp)

  return (
    <div className="flex flex-col items-center gap-[26px] px-5 pb-8 text-center">
      <div className="-mx-5 flex h-12 w-[calc(100%+40px)] items-center justify-center gap-2 border-b border-kabin-line/70">
        <LogoMark size={20} />
        <span className="font-display text-small font-semibold text-kabin-soft">booth kalian siap</span>
        <span
          aria-hidden
          className={cn("size-1.5 rounded-full", partner?.joined ? "bg-ok" : "animate-blink bg-shutter")}
        />
      </div>

      <div className="flex w-full items-center justify-between">
        <BackButton
          label={partner?.joined ? "Kembali ke booth" : "Batal"}
          onClick={() => {
            if (partner?.joined) {
              closeInvite()
              return
            }
            leave()
            router.push("/")
          }}
        />
        <ConnectionPill conn={conn} attempt={attempt} />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display-md font-semibold">Kirim link ini ke dia</h1>
        <p className="text-small text-muted-foreground">Dia cukup klik, nggak perlu daftar.</p>
      </div>

      <div className="flex w-full flex-col gap-3.5 rounded-md bg-card px-3.5 py-4">
        <span className="text-caption text-faint-foreground">Kode room</span>
        <div className="flex justify-center gap-[7px]" aria-label={`Kode room ${code.split("").join(" ")}`}>
          {code.split("").map((ch, i) => (
            <span
              key={i}
              aria-hidden
              className="flex h-[54px] w-[42px] items-center justify-center rounded-sm bg-background pl-[0.12em] font-display text-[26px] font-semibold tracking-code"
            >
              {ch}
            </span>
          ))}
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center gap-2.5 rounded-[8px] border border-border bg-background py-1.5 pr-1.5 pl-3">
          <span className="flex min-w-0 flex-1 flex-col gap-px text-left">
            <span className="text-[10px] text-faint-foreground">Link room</span>
            <span className="truncate font-mono text-meta text-faint-foreground">
              {SITE_HOST}/r/<span className="font-semibold text-foreground">{code}</span>
            </span>
          </span>
          <Button variant="secondary" size="sm" className="h-[38px] rounded-sm px-4 text-meta" onClick={copyInviteLink}>
            Salin
          </Button>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2.5">
        <Button onClick={shareWhatsApp}>
          <WhatsAppIcon data-icon="inline-start" />
          Kirim lewat WhatsApp
        </Button>
        <Button variant="secondary" onClick={copyInviteLink}>
          <CopyIcon data-icon="inline-start" />
          Salin link
        </Button>
      </div>

      <div className="relative flex w-full items-center gap-3.5 overflow-hidden rounded-md border-[1.5px] border-dashed border-outline bg-sunken px-4 py-[18px] text-left">
        <span aria-hidden className="absolute inset-0 bg-dots [--dots-color:rgb(138_136_148/0.18)] [background-size:12px_12px]" />
        <WaitingPair joined={!!partner?.joined} className="relative" />
        <span className="relative flex flex-1 flex-col gap-[3px]" aria-live="polite">
          <span className="text-label font-semibold text-foreground">
            {partner?.joined ? `${partner.name} sudah masuk` : "Nunggu dia masuk…"}
          </span>
          <span className="text-meta text-muted-foreground">Room hidup 15 menit kalau dia belum masuk.</span>
        </span>
      </div>

      <div className="flex w-full items-center gap-2.5">
        <span className="h-[3px] flex-1 rounded-[2px] bg-shutter" />
        <span className="h-[3px] flex-1 rounded-[2px] bg-border" />
        <span className="h-[3px] flex-1 rounded-[2px] bg-border" />
        <span className="text-caption whitespace-nowrap text-faint-foreground">Langkah 1 dari 3</span>
      </div>
    </div>
  )
}
