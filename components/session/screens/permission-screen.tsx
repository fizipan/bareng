"use client"

import Link from "next/link"
import { CameraIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession } from "@/stores/session"

// Layar Izin kamera (prototipe baris 495–514).
export function PermissionScreen() {
  const allowCamera = useSession((s) => s.allowCamera)
  const denyCamera = useSession((s) => s.denyCamera)

  return (
    <div className="flex flex-1 flex-col justify-center gap-6 px-5 py-8">
      <div
        aria-hidden
        className="relative flex size-[150px] items-center justify-center self-center rounded-full border-2 border-darkroom-2 bg-kabin-sunken"
      >
        <span className="absolute size-[118px] rounded-full border-[1.5px] border-[#302C3D]" />
        <span className="absolute size-[86px] rounded-full border-[1.75px] border-kabin-line bg-[#141220]" />
        <span className="absolute size-11 rounded-full bg-darkroom-2" />
        <span className="absolute size-3.5 -translate-x-3.5 -translate-y-3.5 rounded-full bg-flash" />
        <span className="absolute right-3.5 bottom-[18px] size-2.5 rounded-full bg-shutter" />
      </div>

      <div className="flex flex-col gap-2.5">
        <h1 className="font-display text-display-md font-semibold">Nyalakan kamera</h1>
        <p className="max-w-[36ch] text-body text-soft-foreground">
          Kamera cuma nyala di layar kalian berdua. Yang kami simpan cuma foto jadinya.
        </p>
        {/* Tab baru supaya sesi & kamera di tab ini tidak terputus. */}
        <Button
          variant="link"
          size="inline"
          className="self-start font-normal underline"
          render={<Link href="/privasi" target="_blank" rel="noopener" />}
          nativeButton={false}
        >
          Baca halaman privasi
        </Button>
      </div>

      <div className="flex flex-col gap-2.5">
        <Button onClick={allowCamera}>
          <CameraIcon data-icon="inline-start" />
          Izinkan kamera
        </Button>
        <Button variant="ghost" className="text-label" onClick={denyCamera}>
          Nanti dulu
        </Button>
      </div>
    </div>
  )
}
