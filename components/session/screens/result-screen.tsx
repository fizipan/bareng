"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CopyIcon, DownloadIcon, FileImageIcon, PlusIcon, Share2Icon, Trash2Icon } from "lucide-react"
import { LostStrip } from "@/components/art/lost-strip"
import { ActionTile, actionTileFrame } from "@/components/common/action-tile"
import { InstallTile } from "@/components/pwa/install-button"
import { FrameFill } from "@/components/strip/frame-fill"
import { Strip } from "@/components/strip/strip"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SITE_HOST } from "@/lib/brand"
import { PREMIUM_PRICE_LABEL } from "@/lib/content/pricing"
import { formatLongDate, formatStripDate } from "@/lib/format"
import { getFilter } from "@/lib/templates/filters"
import { getTemplate } from "@/lib/templates/builtin"
import { warn } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { useSession } from "@/stores/session"
import { TemplatePicker } from "../template-picker"

// Layar Hasil, mode Kertas (prototipe baris 752–841). Satu momen orkestrasi
// PRD §15.7: strip meluncur keluar dari slot mesin.
export function ResultScreen() {
  const router = useRouter()
  const s = useSession()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const template = getTemplate(s.templateId)
  const isFree = s.tier !== "premium"
  const date = s.result ? new Date(s.result.createdAt) : new Date()
  const keepUntil = s.result?.expiresAt ? formatLongDate(new Date(s.result.expiresAt)) : null

  // Tunggu photostrip terunggah dulu supaya link yang sudah dibagikan tidak kosong.
  const restart = async () => {
    setLeaving(true)
    await s.settle()
    s.reset()
    router.push("/")
  }

  // Pasangan menghapus photostrip-nya.
  if (s.roomId && !s.result) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-9 text-center">
        <LostStrip />
        <h1 className="font-display text-display-md font-semibold">Photostrip ini sudah dihapus</h1>
        <p className="max-w-[34ch] text-body text-muted-foreground">Link-nya sudah mati untuk kalian berdua.</p>
        <Button onClick={restart}>
          <PlusIcon data-icon="inline-start" />
          Foto lagi
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-[22px] px-5 pt-3 pb-9 text-center">
      <h1 className="font-display text-display-md font-semibold">Jadi! Ini photostrip kalian.</h1>

      <div className="relative flex w-full flex-col items-center">
        <span
          aria-hidden
          className="absolute inset-0 bg-dots [mask-image:linear-gradient(#000,transparent_88%)]"
        />
        <span aria-hidden className="relative h-1.5 w-[250px] max-w-full rounded-[3px] bg-darkroom" />
        <div className="relative overflow-hidden pt-0.5">
          <div className="animate-strip-out">
            <Strip
              template={template}
              tokens={{ date: formatStripDate(date), host: SITE_HOST }}
              watermark={isFree}
              filter={getFilter(s.filterId).css}
              shadow="strip"
              className="w-[212px]"
              renderHalf={(i, side) => {
                const f = s.frames[i]
                return f ? <FrameFill source={f[side]} side={side} /> : null
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2.5">
        <Button
          disabled={saving}
          onClick={async () => {
            setSaving(true)
            await s.download()
            setSaving(false)
          }}
        >
          <DownloadIcon data-icon="inline-start" className={cn(saving && "animate-blink")} />
          {saving ? "Menyiapkan file…" : "Unduh photostrip"}
        </Button>
        <div className="flex gap-2.5">
          <Button variant="secondary" className="flex-1 text-label" onClick={s.share}>
            <Share2Icon data-icon="inline-start" />
            Bagikan
          </Button>
          <Button variant="secondary" className="flex-1 text-label" onClick={s.copyResultLink}>
            <CopyIcon data-icon="inline-start" />
            Salin link
          </Button>
        </div>
      </div>

      {isFree ? (
        <div className="flex w-full flex-col gap-2.5 rounded-md bg-card p-4 text-left">
          <span className="text-label font-semibold">Simpan tanpa watermark, HD, plus semua template.</span>
          {keepUntil && (
            <span className="text-caption text-muted-foreground">Versi gratis tersimpan sampai {keepUntil}.</span>
          )}
          <Button variant="link" size="inline" className="self-start text-label text-shutter" onClick={s.openPaywall}>
            Lihat premium — {PREMIUM_PRICE_LABEL}
          </Button>
        </div>
      ) : (
        <div className="w-full rounded-md bg-card px-4 py-3.5 text-left text-small text-soft-foreground">
          Sesi premium aktif. Tanpa watermark, kualitas tinggi, tersimpan selamanya.
        </div>
      )}

      <section className="flex w-full flex-col gap-2.5 text-left">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-small font-semibold">Ganti template</h2>
          <span className="text-caption text-muted-foreground">{template.name}</span>
        </div>
        <TemplatePicker value={s.templateId} onChange={s.setTemplate} />
      </section>

      <div className="flex w-full flex-col gap-2.5 border-t border-border pt-1">
        <span className="pt-2.5 text-left text-caption text-muted-foreground">Lanjut ke mana?</span>
        {s.result && (
          <Link href={`/p/${s.result.slug}`} className={actionTileFrame}>
            <ActionTile
              icon={<FileImageIcon />}
              title="Buka halaman publik"
              description="Halaman yang dia lihat kalau kamu share"
            />
          </Link>
        )}
        <button type="button" className={actionTileFrame} onClick={restart} disabled={leaving}>
          <ActionTile
            icon={<PlusIcon />}
            title="Foto lagi"
            description={leaving ? "Menyimpan photostrip dulu…" : "Mulai sesi baru dari awal"}
          />
        </button>
        <InstallTile autoOpen />
        <Button variant="ghost" size="sm" className="self-center text-muted-foreground" onClick={() => setConfirmDelete(true)}>
          <Trash2Icon data-icon="inline-start" />
          Hapus foto ini
        </Button>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Hapus photostrip ini?</DialogTitle>
            <DialogDescription>
              Foto hilang untuk kalian berdua dan link-nya mati. Ini nggak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button
              onClick={async () => {
                setConfirmDelete(false)
                try {
                  await s.deleteResult()
                  s.reset()
                  router.push("/")
                } catch {
                  warn("Belum bisa menghapus, coba lagi")
                }
              }}
            >
              Hapus foto
            </Button>
            <DialogClose render={<Button variant="ghost" />}>Batal</DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
