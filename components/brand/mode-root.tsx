import { cn } from "@/lib/utils"

export type Mode = "kabin" | "kertas"

// Pembungkus halaman. `.kabin` mengganti token semantik ke mode gelap;
// globals.css memakai :has(.mode-root.kabin) supaya portal ikut gelap.
export function ModeRoot({
  mode,
  className,
  children,
}: {
  mode: Mode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "mode-root relative flex min-h-dvh flex-col bg-background text-foreground",
        mode === "kabin" && "kabin",
        className
      )}
    >
      {mode === "kabin" && <div aria-hidden className="kabin-grain" />}
      {children}
    </div>
  )
}
