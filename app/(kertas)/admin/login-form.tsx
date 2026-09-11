"use client"

import { useId, useState } from "react"
import { useFormStatus } from "react-dom"
import { AlertCircleIcon, EyeIcon, EyeOffIcon, LockKeyholeIcon, LogInIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Form masuk admin: satu kolom password (bisa ditampilkan), pesan salah di
// bawah kolom, tombol dengan status memeriksa.
export function LoginForm({ action, error }: { action: (form: FormData) => Promise<void>; error: boolean }) {
  const id = useId()
  const [show, setShow] = useState(false)

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-small font-semibold">
          Password admin
        </label>
        <div className="relative">
          <LockKeyholeIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground" />
          <input
            id={id}
            name="password"
            type={show ? "text" : "password"}
            required
            autoFocus
            autoComplete="current-password"
            aria-invalid={error || undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={cn(
              "h-12 w-full rounded-md border-[1.5px] bg-background pr-12 pl-11 text-body outline-none transition-colors",
              error ? "border-shutter" : "border-line focus-visible:border-foreground"
            )}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
            aria-pressed={show}
            className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-card hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {show ? <EyeOffIcon className="size-[18px]" /> : <EyeIcon className="size-[18px]" />}
          </button>
        </div>
        {error && (
          <p id={`${id}-error`} role="alert" className="flex items-center gap-1.5 text-small text-shutter">
            <AlertCircleIcon aria-hidden className="size-4 shrink-0" />
            Password salah, coba lagi.
          </p>
        )}
      </div>
      <Submit />
    </form>
  )
}

function Submit() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      <LogInIcon data-icon="inline-start" />
      {pending ? "Memeriksa…" : "Masuk"}
    </Button>
  )
}
