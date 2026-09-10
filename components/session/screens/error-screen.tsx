"use client"

import { useRouter } from "next/navigation"
import { RotateCcwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ERROR_COPY, type ErrorKind } from "@/lib/content/errors"
import { warn } from "@/lib/toast"
import { useSession } from "@/stores/session"

// State error & edge (prototipe baris 1029–1072): apa yang terjadi, kenapa,
// satu tombol tindakan.
export function ErrorScreen() {
  const router = useRouter()
  const kind = useSession((s) => s.errorKind)
  const errorAction = useSession((s) => s.errorAction)
  const createRoom = useSession((s) => s.createRoom)
  const copy = ERROR_COPY[kind]

  const act = async () => {
    if (kind === "camera" || kind === "putus" || kind === "jaringan") {
      errorAction()
      return
    }
    try {
      router.replace(`/r/${await createRoom()}`)
    } catch {
      warn("Belum bisa bikin room, coba lagi sebentar")
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-5 px-5 py-8">
      <div className="relative flex h-[170px] w-full items-center justify-center overflow-hidden rounded-md border-[1.5px] border-darkroom-2 bg-kabin-sunken">
        <span aria-hidden className="absolute inset-0 bg-dots [--dots-color:rgb(138_136_148/0.18)] [background-size:12px_12px]" />
        <Illustration kind={kind} />
      </div>
      <div className="flex flex-col gap-2.5" role="alert">
        <h1 className="font-display text-display-md font-semibold">{copy.title}</h1>
        <p className="max-w-[36ch] text-body text-soft-foreground">{copy.why}</p>
      </div>
      <Button onClick={act}>
        <RotateCcwIcon data-icon="inline-start" />
        {copy.cta}
      </Button>
    </div>
  )
}

function Illustration({ kind }: { kind: ErrorKind }) {
  if (kind === "camera") {
    return (
      <span aria-hidden className="relative flex size-[104px] items-center justify-center rounded-full border-[1.75px] border-kabin-line bg-[#141220]">
        <span className="size-[52px] rounded-full bg-darkroom-2" />
        <span className="absolute h-1 w-[132px] -rotate-45 rounded-[2px] bg-shutter" />
      </span>
    )
  }
  if (kind === "penuh") {
    return (
      <span aria-hidden className="relative flex items-end gap-3.5">
        <Figure className="bg-shutter" />
        <Figure className="bg-flash" />
        <span className="relative flex flex-col items-center gap-[5px] opacity-50">
          <span className="size-6 rounded-full border-[1.75px] border-dashed border-grain" />
          <span className="h-8 w-9 rounded-t-[13px] rounded-b-[3px] border-[1.75px] border-dashed border-grain" />
          <span className="absolute top-4 h-[3px] w-[52px] -rotate-45 bg-shutter" />
          <span className="absolute top-4 h-[3px] w-[52px] rotate-45 bg-shutter" />
        </span>
      </span>
    )
  }
  if (kind === "putus") {
    return (
      <span aria-hidden className="relative flex items-center gap-2.5">
        <span className="h-10 w-[52px] rounded-[8px] border-2 border-kertas" />
        <span className="h-[3px] w-[22px] bg-grain" />
        <span className="size-3 animate-[blink_1.4s_ease-in-out_infinite] rounded-full bg-flash" />
        <span className="h-[3px] w-[22px] bg-kabin-line" />
        <span className="h-10 w-[52px] rounded-[8px] border-2 border-dashed border-grain" />
      </span>
    )
  }
  if (kind === "jaringan") {
    return (
      <span aria-hidden className="relative flex items-center gap-2.5">
        <span className="h-10 w-[52px] rounded-[8px] border-2 border-kertas" />
        <span className="h-[3px] w-[22px] bg-grain" />
        <span className="size-3 rounded-full bg-shutter" />
        <span className="h-[3px] w-[22px] bg-kabin-line" />
        <span className="h-10 w-[52px] rounded-[8px] border-2 border-dashed border-grain" />
      </span>
    )
  }
  // kadaluarsa & tidak-ada: jam berhenti.
  return (
    <span aria-hidden className="relative flex size-[104px] items-center justify-center rounded-full border-2 border-grain">
      <span className="absolute h-[34px] w-[3px] -translate-y-[17px] rounded-[2px] bg-kertas" />
      <span className="absolute h-[3px] w-[26px] translate-x-[13px] rounded-[2px] bg-shutter" />
      <span className="size-2 rounded-full bg-kertas" />
    </span>
  )
}

function Figure({ className }: { className: string }) {
  return (
    <span className="flex flex-col items-center gap-[5px]">
      <span className={`size-6 rounded-full ${className}`} />
      <span className={`h-8 w-9 rounded-t-[13px] rounded-b-[3px] ${className}`} />
    </span>
  )
}
