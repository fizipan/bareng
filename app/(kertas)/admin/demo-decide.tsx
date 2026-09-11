"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { BadgeCheckIcon, LoaderCircleIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const DURASI = [
  { value: "7", label: "7 hari" },
  { value: "30", label: "30 hari" },
  { value: "", label: "Tanpa batas" },
] as const

// Setujui (pilih masa berlaku) atau tolak permintaan akses demo. Modal tetap
// terbuka sampai server action selesai.
export function DemoDecide({ id, name, action }: { id: string; name: string; action: (form: FormData) => Promise<void> }) {
  const [open, setOpen] = useState<null | "setuju" | "tolak">(null)
  const approve = open === "setuju"

  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setOpen("setuju")}>
          <BadgeCheckIcon data-icon="inline-start" />
          Setujui
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen("tolak")}>
          Tolak
        </Button>
      </div>

      <Dialog open={!!open} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent className="gap-5 p-6 sm:max-w-[400px]" showCloseButton={false}>
          <DialogHeader className="gap-1.5">
            <span aria-hidden className="grid size-11 place-items-center rounded-full bg-card text-soft-foreground">
              {approve ? <BadgeCheckIcon className="size-5" /> : <XIcon className="size-5" />}
            </span>
            <DialogTitle className="text-title">{approve ? `Setujui akses demo ${name}?` : `Tolak permintaan ${name}?`}</DialogTitle>
            <DialogDescription className="text-small text-muted-foreground">
              {approve
                ? "Perangkat yang mengirim permintaan ini bisa foto tanpa batas harian, dan hasilnya premium."
                : "Permintaan ditandai ditolak. Orangnya masih bisa mengirim permintaan baru."}
            </DialogDescription>
          </DialogHeader>

          <form
            action={async (form) => {
              await action(form)
              setOpen(null)
            }}
            className="flex flex-col gap-5"
          >
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="approve" value={approve ? "1" : "0"} />
            {approve && (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-caption font-semibold text-soft-foreground">Berlaku</legend>
                <div className="flex gap-2">
                  {DURASI.map((d, i) => (
                    <label
                      key={d.label}
                      className="flex flex-1 cursor-pointer items-center justify-center rounded-md border-[1.5px] border-line px-2 py-2.5 text-small font-semibold text-soft-foreground transition-colors has-checked:border-foreground has-checked:bg-foreground has-checked:text-background"
                    >
                      <input type="radio" name="hari" value={d.value} defaultChecked={i === 1} className="sr-only" />
                      {d.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <div className="flex flex-col gap-2">
              <Submit label={approve ? "Ya, setujui" : "Ya, tolak"} variant={approve ? "primary" : "secondary"} />
              <DialogClose render={<Button variant="ghost" type="button" />}>Batal</DialogClose>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Submit({ label, variant }: { label: string; variant: "primary" | "secondary" }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant={variant} aria-busy={pending || undefined} className={pending ? "cursor-progress" : undefined}>
      {pending && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
      {label}
    </Button>
  )
}
