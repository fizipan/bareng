import { cn } from "@/lib/utils"

export type PillTone = "ok" | "lambat" | "putus" | "idle"

const DOT: Record<PillTone, string> = {
  ok: "bg-ok",
  lambat: "bg-flash",
  putus: "bg-shutter",
  idle: "bg-grain",
}

// Pill status PRD §15.5: caption + titik berwarna. ok = tersambung,
// flash = lambat, shutter = terputus.
export function StatusPill({
  tone = "ok",
  className,
  children,
  ...props
}: React.ComponentProps<"span"> & {
  tone?: PillTone
}) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center gap-[7px] rounded-full bg-card px-3 py-[7px] text-caption text-soft-foreground",
        className
      )}
    >
      <span aria-hidden className={cn("size-[7px] shrink-0 rounded-full", DOT[tone])} />
      {children}
    </span>
  )
}
