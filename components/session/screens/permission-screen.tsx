"use client"

import { useEffect } from "react"
import Link from "next/link"
import { CameraIcon } from "lucide-react"
import { Lens } from "@/components/art/lens"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMedia } from "@/stores/media"
import { useSession } from "@/stores/session"

// Layar Izin kamera (prototipe baris 495–514). getUserMedia baru dipanggil
// setelah klik (quirk iOS) — kecuali izin sudah pernah diberikan.
export function PermissionScreen() {
  const allowCamera = useSession((s) => s.allowCamera)
  const denyCamera = useSession((s) => s.denyCamera)
  const autoCamera = useSession((s) => s.autoCamera)
  const opening = useMedia((m) => m.opening)

  useEffect(() => {
    if (autoCamera) allowCamera()
  }, [autoCamera, allowCamera])

  return (
    <div className="flex flex-1 flex-col justify-center gap-6 px-5 py-8">
      <Lens size={150} className="self-center" />

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
        <Button onClick={allowCamera} disabled={opening}>
          <CameraIcon data-icon="inline-start" className={cn(opening && "animate-blink")} />
          {opening ? "Menyalakan kamera…" : "Izinkan kamera"}
        </Button>
        <Button variant="ghost" className="text-label" onClick={denyCamera} disabled={opening}>
          Nanti dulu
        </Button>
      </div>
    </div>
  )
}
