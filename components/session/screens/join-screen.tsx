"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRightIcon, PlusIcon } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { MiniStrip } from "@/components/art/mini-strip"
import { Button } from "@/components/ui/button"
import { warn } from "@/lib/toast"
import { useSession } from "@/stores/session"
import { BackButton } from "../back-button"
import { ROOM_CODE_LENGTH, RoomCodeInput } from "../room-code-input"

// Layar Gabung untuk tamu yang pegang kode (prototipe baris 443–493).
export function JoinScreen() {
  const router = useRouter()
  const createRoom = useSession((s) => s.createRoom)
  const [code, setCode] = useState("")
  const complete = code.length === ROOM_CODE_LENGTH

  const join = (value = code) => {
    if (value.length === ROOM_CODE_LENGTH) router.push(`/r/${value}`)
  }

  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-col gap-[22px] px-5 pt-3 pb-8">
      <div className="flex items-center justify-between">
        <BackButton onClick={() => router.push("/")} />
        <Logo size={24} wordmarkClassName="text-[17px]" />
      </div>

      <div className="flex items-center gap-3.5 rounded-md bg-card p-3.5">
        <MiniStrip />
        <span className="flex flex-1 flex-col gap-[3px]">
          <span className="text-label font-semibold">Ada yang ngajak kamu foto bareng?</span>
          <span className="text-meta text-muted-foreground">Empat foto, satu photostrip. Nggak perlu daftar.</span>
        </span>
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          join()
        }}
      >
        <label className="text-small font-semibold" htmlFor="room-code">
          Masukin kode dari dia
        </label>
        <RoomCodeInput value={code} onChange={setCode} onComplete={join} autoFocus />
        <span className="text-caption text-faint-foreground">
          Kodenya 6 huruf, ada di layar dia. Atau tinggal klik link yang dia kirim.
        </span>
        <div className="mt-2.5 flex flex-col gap-2.5">
          <Button type="submit" disabled={!complete}>
            <ArrowRightIcon data-icon="inline-start" />
            Gabung ke room
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="text-label"
            onClick={async () => {
              try {
                router.push(`/r/${await createRoom()}`)
              } catch {
                warn("Belum bisa bikin room, coba lagi sebentar")
              }
            }}
          >
            <PlusIcon data-icon="inline-start" />
            Buat room sendiri
          </Button>
        </div>
      </form>

      <div className="flex items-start gap-2.5 rounded-md border-[1.5px] border-dashed border-outline p-3.5">
        <span aria-hidden className="mt-[5px] size-2 shrink-0 rounded-full bg-flash" />
        <span className="text-meta text-muted-foreground">
          Kalau muncul &ldquo;room penuh&rdquo;, berarti sudah ada dua orang di dalam. Minta dia buat room baru ya.
        </span>
      </div>
    </main>
  )
}
