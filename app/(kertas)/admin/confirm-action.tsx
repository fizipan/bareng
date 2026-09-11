"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { EyeOffIcon, LogOutIcon, ShieldCheckIcon, UnplugIcon, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Variant = "primary" | "secondary" | "ghost"

// Ikon lewat kunci teks: komponen tidak bisa dikirim dari server component.
const ICONS = { turunkan: EyeOffIcon, abaikan: ShieldCheckIcon, keluar: LogOutIcon, cabut: UnplugIcon } satisfies Record<string, LucideIcon>

// Tombol aksi admin dengan modal konfirmasi. Form (dengan field tersembunyi)
// ada di dalam modal; modal tetap terbuka sampai server action selesai.
export function ConfirmAction({
  action,
  fields = {},
  icon,
  label,
  variant = "secondary",
  title,
  description,
  confirmLabel,
}: {
  action: (form: FormData) => Promise<void>
  fields?: Record<string, string>
  icon: keyof typeof ICONS
  label: string
  variant?: Variant
  title: string
  description: React.ReactNode
  confirmLabel: string
}) {
  const [open, setOpen] = useState(false)
  const Icon = ICONS[icon]

  return (
    <>
      <Button type="button" variant={variant} size="sm" onClick={() => setOpen(true)}>
        <Icon data-icon="inline-start" />
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <span aria-hidden className="mb-1 grid size-11 place-items-center rounded-full bg-card">
              <Icon className="size-5" />
            </span>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <form
            action={async (form) => {
              await action(form)
              setOpen(false)
            }}
            className="flex flex-col gap-2"
          >
            {Object.entries(fields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <Submit icon={Icon} label={confirmLabel} />
            <DialogClose render={<Button variant="ghost" type="button" />}>Batal</DialogClose>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Submit({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      <Icon data-icon="inline-start" />
      {pending ? "Memproses…" : label}
    </Button>
  )
}
