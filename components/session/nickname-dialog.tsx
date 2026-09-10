"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Nama panggilan opsional (PRD R1). Muncul di tile, chip siap, dan halaman publik.
export function NicknameDialog({
  open,
  current,
  onOpenChange,
  onSave,
}: {
  open: boolean
  current: string
  onOpenChange: (open: boolean) => void
  onSave: (name: string) => void
}) {
  const [name, setName] = useState(current === "Kamu" ? "" : current)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Nama panggilan kamu</DialogTitle>
          <DialogDescription>Biar dia tahu ini kamu. Boleh dikosongkan.</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            onSave(name.trim())
            onOpenChange(false)
          }}
        >
          <input
            autoFocus
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            placeholder="mis. Rara"
            aria-label="Nama panggilan"
            className="h-12 rounded-md border-[1.5px] border-outline-subtle bg-sunken px-3.5 text-body outline-none focus-visible:border-shutter"
          />
          <Button type="submit">Simpan</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
