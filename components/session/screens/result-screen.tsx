"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckIcon, ClockIcon, CopyIcon, DownloadIcon, FileImageIcon, PlusIcon, Share2Icon, Trash2Icon } from "lucide-react"
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
import { PAYMENTS_LIVE, PREMIUM_PRICE_LABEL } from "@/lib/content/pricing"
import { daysLeft, formatLongDate, formatStripDate } from "@/lib/format"
import { getFilter } from "@/lib/templates/filters"
import { getTemplate } from "@/lib/templates/builtin"
import { warn } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { useSession } from "@/stores/session"
import { TemplatePicker } from "../template-picker"

const PREMIUM_PERKS = ["Tanpa watermark", "Kualitas HD", "Semua 6 template", "Simpan permanen"]

// Layar Hasil, mode Kertas (prototipe baris 752–841). Satu momen orkestrasi
// PRD §15.7: strip meluncur keluar dari slot mesin. Layar lebar: strip di kiri,
// judul & aksi di kanan; HP: satu kolom dengan aksi utama melayang di bawah.
export function ResultScreen() {
  const router = useRouter()
  const s = useSession()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const template = getTemplate(s.templateId)
  const isFree = s.tier !== "premium"
  const date = s.result ? new Date(s.result.createdAt) : new Date()
  const expiresAt = s.result?.expiresAt ? new Date(s.result.expiresAt).getTime() : null

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

  const partnerName = s.partner?.name ?? "Dia"
  const names = `${s.me.name} & ${partnerName}`

  return (
    <div className="@container flex flex-1 flex-col">
      <div className="mx-auto grid w-full max-w-[440px] gap-6 px-5 pt-3 pb-10 @3xl:max-w-[960px] @3xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)] @3xl:grid-rows-[auto_1fr] @3xl:gap-x-14 @3xl:gap-y-8 @3xl:px-10 @3xl:pt-10 @3xl:pb-16">
        <header className="flex flex-col items-center gap-1.5 text-center @3xl:col-start-2 @3xl:row-start-1 @3xl:items-start @3xl:gap-2.5 @3xl:pt-2 @3xl:text-left">
          <h1 className="font-display text-display-md font-semibold @3xl:text-display-lg @3xl:font-bold @3xl:tracking-[-0.01em]">
            Jadi! Ini photostrip kalian.
          </h1>
          <p className="text-small text-muted-foreground @3xl:text-body">
            {names} · {formatLongDate(date)}
          </p>
        </header>

        {/* Strip keluar dari slot mesin; di layar lebar tetap terlihat saat scroll. */}
        <div className="relative flex flex-col items-center overflow-hidden rounded-md bg-card px-5 pt-6 pb-2 @3xl:sticky @3xl:top-8 @3xl:col-start-1 @3xl:row-span-2 @3xl:row-start-1 @3xl:self-start @3xl:pt-8 @3xl:pb-4">
          <span aria-hidden className="absolute inset-0 bg-dots [mask-image:linear-gradient(#000,transparent_90%)]" />
          <span aria-hidden className="relative z-10 h-2 w-[236px] max-w-full rounded-full bg-darkroom shadow-[0_2px_0_rgb(255_255_255/0.6)]" />
          <div className="relative -mt-1 overflow-hidden px-3 pt-1 pb-6">
            <div className="animate-strip-out">
              <Strip
                template={template}
                tokens={{ date: formatStripDate(date), host: SITE_HOST, names: s.result?.names }}
                watermark={isFree}
                filter={getFilter(s.filterId).css}
                shadow="strip"
                className="w-[200px] @3xl:w-[236px]"
                renderHalf={(i, side) => {
                  const f = s.frames[i]
                  return f ? <FrameFill source={f[side]} side={side} /> : null
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-6 @3xl:col-start-2 @3xl:row-start-2">
          {/* Aksi utama melayang di bawah layar HP selama strip memenuhi layar,
              lalu menempel di tempatnya saat di-scroll. */}
          <div className="sticky bottom-0 z-10 -mx-5 -mt-4 bg-linear-to-t from-background from-70% to-transparent px-5 pt-4 pb-[max(12px,env(safe-area-inset-bottom))] @3xl:static @3xl:mx-0 @3xl:mt-0 @3xl:bg-none @3xl:p-0">
            <div className="flex flex-col gap-2.5">
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
                <Button variant="secondary" className="flex-1 bg-background text-label" onClick={s.share}>
                  <Share2Icon data-icon="inline-start" />
                  Bagikan
                </Button>
                <Button variant="secondary" className="flex-1 bg-background text-label" onClick={s.copyResultLink}>
                  <CopyIcon data-icon="inline-start" />
                  Salin link
                </Button>
              </div>
            </div>
          </div>

          {isFree ? (
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-4 rounded-md bg-darkroom p-5 text-kertas">
                <div className="flex flex-col gap-2">
                  <span className="flex items-center gap-2">
                    <span className="rounded-sm bg-flash px-[7px] py-[3px] text-caption leading-none font-semibold text-darkroom">
                      Premium
                    </span>
                    <span className="text-caption text-kabin-soft">sekali bayar, untuk kalian berdua</span>
                  </span>
                  <span className="font-display text-title font-bold">Simpan tanpa watermark, HD, plus semua template.</span>
                </div>
                <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-small text-[#E4E2E8]">
                  {PREMIUM_PERKS.map((perk) => (
                    <li key={perk} className="flex items-center gap-2">
                      <CheckIcon aria-hidden className="size-4 shrink-0 text-flash" strokeWidth={2.5} />
                      {perk}
                    </li>
                  ))}
                </ul>
                <Button variant="paper" onClick={s.openPaywall}>
                  {PAYMENTS_LIVE ? `Lihat premium — ${PREMIUM_PRICE_LABEL}` : "Lihat premium"}
                </Button>
              </div>
              {expiresAt && (
                <span className="flex items-center justify-center gap-1.5 text-caption text-soft-foreground @3xl:justify-start">
                  <ClockIcon aria-hidden className="size-3.5 text-shutter" />
                  Versi gratis hilang {daysLeft(expiresAt)}, tanggal {formatLongDate(new Date(expiresAt))}.
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-3.5 rounded-md bg-darkroom p-5 text-left text-kertas">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-flash text-darkroom">
                <CheckIcon className="size-5" strokeWidth={2.5} />
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-label font-semibold">Sesi premium aktif.</span>
                <span className="text-small text-kabin-soft">Tanpa watermark, kualitas tinggi, tersimpan selamanya.</span>
              </span>
            </div>
          )}

          <section className="flex flex-col gap-2.5 text-left">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-small font-semibold">Ganti template</h2>
              <span className="text-caption text-muted-foreground">{template.name}</span>
            </div>
            <TemplatePicker value={s.templateId} onChange={s.setTemplate} />
            <span className="text-caption text-muted-foreground">Photostrip di layar {partnerName.toLowerCase() === "dia" ? "dia" : partnerName} ikut berubah.</span>
          </section>

          <div className="flex flex-col gap-2.5 border-t border-border pt-1">
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
        </div>
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
