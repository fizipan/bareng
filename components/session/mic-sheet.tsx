"use client"

import { useEffect, useState } from "react"
import { CheckIcon, LoaderCircleIcon, MicIcon, MicOffIcon, RotateCcwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import type { CameraFailure } from "@/lib/rtc/media"
import { useFrame } from "./frame-context"
import { guideFor } from "./permission-guide"

// ask → (klik Izinkan) waiting → selesai / gagal (denied, busy, …).
export type MicStep = "ask" | "waiting" | CameraFailure

// Status izin mic dari browser, ikut berubah kalau diubah di setelan situs.
export function useMicPermission(enabled: boolean) {
  const [state, setState] = useState<PermissionState | "unsupported">("prompt")
  useEffect(() => {
    if (!enabled) return
    let status: PermissionStatus | null = null
    let alive = true
    const sync = () => status && setState(status.state)
    navigator.permissions
      ?.query({ name: "microphone" as PermissionName })
      .then((s) => {
        if (!alive) return
        status = s
        sync()
        s.addEventListener("change", sync)
      })
      .catch(() => alive && setState("unsupported"))
    return () => {
      alive = false
      status?.removeEventListener("change", sync)
    }
  }, [enabled])
  return state
}

const FAILURES: Record<Exclude<CameraFailure, "denied">, { title: string; body: string }> = {
  busy: {
    title: "Mikrofon lagi dipakai aplikasi lain",
    body: "Tutup dulu aplikasi yang memakai mic (Zoom, Meet, telepon WhatsApp), lalu coba lagi.",
  },
  missing: { title: "Mikrofon nggak ketemu", body: "Sambungkan earphone atau mic, lalu coba lagi." },
  insecure: { title: "Mikrofon cuma bisa nyala lewat https", body: "Buka Bareng lewat alamat https, lalu coba lagi." },
  unknown: { title: "Mikrofon belum bisa dinyalakan", body: "Coba sekali lagi. Kalau masih gagal, muat ulang halaman." },
}

// Lembar izin mikrofon: penjelasan sebelum browser bertanya, tanda menunggu
// pop-up izin, dan panduan per browser kalau diblokir. Mic tetap opsional.
export function MicSheet({
  step,
  permission,
  onClose,
  onAllow,
}: {
  step: MicStep | null
  // Status izin situs; dipakai untuk menebak penyebab kalau mic ditolak.
  permission?: PermissionState | "unsupported"
  onClose: () => void
  onAllow: () => void
}) {
  const frame = useFrame()
  const wide = useMediaQuery("(min-width: 768px)")
  const desktop = wide && !frame
  // Isi terakhir tetap tampil selama animasi menutup.
  const [shown, setShown] = useState<MicStep>("ask")
  if (step && step !== shown) setShown(step)

  const onOpenChange = (open: boolean) => !open && onClose()
  const body = <MicBody step={shown} permission={permission} desktop={desktop} onAllow={onAllow} onClose={onClose} />

  if (desktop) {
    return (
      <Dialog open={step !== null} onOpenChange={onOpenChange}>
        <DialogContent className="kertas gap-5 p-6 sm:max-w-[400px]" showCloseButton={false}>
          {body}
        </DialogContent>
      </Dialog>
    )
  }
  return (
    <Drawer open={step !== null} onOpenChange={onOpenChange}>
      <DrawerContent className="kertas" container={frame?.container}>
        <div className="mx-auto flex min-h-0 w-full max-w-[440px] flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-5 pt-[22px] pb-[max(26px,env(safe-area-inset-bottom))]">
          {body}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function MicBody({
  step,
  permission,
  desktop,
  onAllow,
  onClose,
}: {
  step: MicStep
  permission?: PermissionState | "unsupported"
  desktop: boolean
  onAllow: () => void
  onClose: () => void
}) {
  const Title = desktop ? DialogTitle : DrawerTitle
  const Description = desktop ? DialogDescription : DrawerDescription

  const header = (icon: React.ReactNode, title: string, desc: string, tone: "ask" | "fail") => (
    <div className="flex items-start gap-3.5">
      <span
        aria-hidden
        className={
          tone === "ask"
            ? "grid size-12 shrink-0 place-items-center rounded-full bg-darkroom text-kertas"
            : "grid size-12 shrink-0 place-items-center rounded-full bg-shutter/12 text-shutter"
        }
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <Title className="text-left text-display-sm">{title}</Title>
        <Description className="text-left text-soft-foreground">{desc}</Description>
      </div>
    </div>
  )

  if (step === "ask" || step === "waiting") {
    const waiting = step === "waiting"
    return (
      <>
        {header(
          waiting ? <LoaderCircleIcon className="size-6 animate-spin" /> : <MicIcon className="size-6" />,
          waiting ? "Menunggu izin browser…" : "Nyalakan mikrofon?",
          waiting
            ? "Pilih Izinkan di pop-up izin, biasanya muncul dekat alamat web."
            : "Biar bisa ngobrol sambil pose. Habis ini browser akan minta izin mikrofon, pilih Izinkan.",
          "ask"
        )}
        <ul className="flex flex-col gap-2.5 rounded-md bg-card p-4 text-small">
          {[
            "Suaramu langsung nyambung ke dia, nggak direkam.",
            "Bisa dimatikan kapan saja dari tombol mic di video kamu.",
            "Pakai earphone biar suaranya nggak menggema.",
          ].map((line) => (
            <li key={line} className="flex gap-2.5">
              <CheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-ok" strokeWidth={2.5} />
              {line}
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2.5">
          <Button onClick={onAllow} disabled={waiting}>
            {waiting ? (
              <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
            ) : (
              <MicIcon data-icon="inline-start" />
            )}
            {waiting ? "Menunggu izin…" : "Izinkan mikrofon"}
          </Button>
          <Button variant="ghost" className="text-label" onClick={onClose}>
            {waiting ? "Batal" : "Nanti saja"}
          </Button>
        </div>
      </>
    )
  }

  if (step === "denied") {
    const guide = guideFor("Mikrofon", permission)
    return (
      <>
        {header(
          <MicOffIcon className="size-6" />,
          "Mikrofon masih diblokir",
          `${guide.browser}: buka izinnya dulu, foto tetap bisa jalan tanpa suara.`,
          "fail"
        )}
        <ol className="flex flex-col gap-3">
          {guide.steps.map((line, i) => (
            <li key={i} className="flex items-start gap-3 text-body">
              <span
                aria-hidden
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-shutter font-display text-caption font-semibold text-kertas"
              >
                {i + 1}
              </span>
              <span className="pt-px">{line}</span>
            </li>
          ))}
        </ol>
        {guide.note && <p className="text-small text-muted-foreground">{guide.note}</p>}
        <div className="flex flex-col gap-2.5">
          <Button onClick={onAllow}>
            <RotateCcwIcon data-icon="inline-start" />
            Sudah, coba lagi
          </Button>
          <Button variant="ghost" className="text-label" onClick={onClose}>
            Lanjut tanpa suara
          </Button>
        </div>
      </>
    )
  }

  const copy = FAILURES[step]
  return (
    <>
      {header(<MicOffIcon className="size-6" />, copy.title, copy.body, "fail")}
      <div className="flex flex-col gap-2.5">
        <Button onClick={onAllow}>
          <RotateCcwIcon data-icon="inline-start" />
          Coba lagi
        </Button>
        <Button variant="ghost" className="text-label" onClick={onClose}>
          Lanjut tanpa suara
        </Button>
      </div>
    </>
  )
}
