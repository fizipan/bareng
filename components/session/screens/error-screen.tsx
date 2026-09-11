"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RotateCcwIcon } from "lucide-react"
import { ErrorArt } from "@/components/art/error-art"
import { Button } from "@/components/ui/button"
import { ERROR_COPY } from "@/lib/content/errors"
import { createRoomError } from "@/lib/content/room-start"
import { warn } from "@/lib/toast"
import { useSession } from "@/stores/session"
import { CameraHelpSheet } from "../camera-help-sheet"

// State error & edge (prototipe baris 1029–1072): apa yang terjadi, kenapa,
// satu tombol tindakan.
export function ErrorScreen() {
  const router = useRouter()
  const kind = useSession((s) => s.errorKind)
  const errorAction = useSession((s) => s.errorAction)
  const createRoom = useSession((s) => s.createRoom)
  const copy = ERROR_COPY[kind]
  const [help, setHelp] = useState(false)

  const act = async () => {
    if (kind === "camera") {
      setHelp(true)
      return
    }
    if (kind === "putus" || kind === "jaringan") {
      errorAction()
      return
    }
    try {
      router.replace(`/r/${await createRoom()}`)
    } catch (e) {
      warn(createRoomError(e))
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-5 px-5 py-8">
      <div className="relative flex h-[170px] w-full items-center justify-center overflow-hidden rounded-md border-[1.5px] border-darkroom-2 bg-kabin-sunken">
        <span aria-hidden className="absolute inset-0 bg-dots [--dots-color:rgb(138_136_148/0.18)] [background-size:12px_12px]" />
        <ErrorArt kind={kind} />
      </div>
      <div className="flex flex-col gap-2.5" role="alert">
        <h1 className="font-display text-display-md font-semibold">{copy.title}</h1>
        <p className="max-w-[36ch] text-body text-soft-foreground">{copy.why}</p>
      </div>
      <Button onClick={act}>
        <RotateCcwIcon data-icon="inline-start" />
        {copy.cta}
      </Button>
      {kind === "camera" && (
        <CameraHelpSheet
          open={help}
          onOpenChange={setHelp}
          onRetry={() => {
            setHelp(false)
            errorAction()
          }}
        />
      )}
    </div>
  )
}
