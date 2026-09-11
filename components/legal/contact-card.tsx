"use client"

import { useEffect, useRef, useState } from "react"
import { CheckIcon, CopyIcon, MailIcon } from "lucide-react"
import { toast } from "sonner"
import { Figure } from "@/components/art/figure"
import { Button } from "@/components/ui/button"
import { SUPPORT_EMAIL } from "@/lib/brand"
import { cn } from "@/lib/utils"

// Kartu kontak (landing, Privasi, Ketentuan). Tombol salin untuk HP yang
// belum punya aplikasi email, jadi mailto: saja nggak cukup. Tokoh melambai
// hanya saat kartu disentuh/di-hover.
export function ContactCard({
  title = "Masih ada yang mau ditanya?",
  hint = "Kami balas dalam 2 hari kerja.",
  className,
}: {
  title?: string
  hint?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
      setCopied(true)
      toast.success("Alamat email disalin")
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(`Gagal menyalin. Tulis manual ya: ${SUPPORT_EMAIL}`)
    }
  }

  return (
    <div
      className={cn(
        "group/contact @container rounded-md border-[1.5px] border-line bg-sunken [&_.animate-wave]:[animation-play-state:paused] [&:is(:hover,:focus-within,:active)_.animate-wave]:[animation-play-state:running]",
        className
      )}
    >
      <div className="flex flex-col gap-4 p-4 @xl:flex-row @xl:items-center @xl:gap-6 @xl:px-6 @xl:py-5">
        <div className="flex min-w-0 flex-1 items-center gap-3.5">
          <span aria-hidden className="relative size-12 shrink-0 overflow-hidden rounded-full bg-kertas-2">
            <Figure who="kamu" pose="lambai" className="absolute inset-x-[6%] -bottom-0.5 h-auto w-[88%]" />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-label font-semibold">{title}</span>
            <span className="text-meta text-muted-foreground">{hint}</span>
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="min-w-0 flex-1 @xl:flex-none"
            render={<a href={`mailto:${SUPPORT_EMAIL}`} />}
            nativeButton={false}
          >
            <MailIcon data-icon="inline-start" />
            <span className="truncate">{SUPPORT_EMAIL}</span>
          </Button>
          <Button
            variant="soft"
            size="sm"
            className="w-11 px-0"
            aria-label={copied ? "Alamat email sudah disalin" : "Salin alamat email"}
            onClick={copy}
          >
            {copied ? <CheckIcon className="text-ok" /> : <CopyIcon />}
          </Button>
        </div>
      </div>
    </div>
  )
}
