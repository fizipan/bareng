import type { ReactNode } from "react"
import { ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Kartu aksi besar: ikon bulat di kiri, judul + keterangan, chevron di kanan
// (prototipe: "Lanjut ke mana?" di Hasil, "Punya kode dari dia?" di landing).
export function ActionTile({
  icon,
  title,
  description,
  chevron = true,
  className,
  iconClassName,
}: {
  icon: ReactNode
  title: string
  description: string
  chevron?: boolean
  className?: string
  iconClassName?: string
}) {
  return (
    <span className={cn("flex w-full items-center gap-3 text-left", className)}>
      <span
        aria-hidden
        className={cn("flex size-8 shrink-0 items-center justify-center rounded-full bg-card [&_svg]:size-4", iconClassName)}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-label font-semibold">{title}</span>
        <span className="text-caption font-normal text-muted-foreground">{description}</span>
      </span>
      {chevron && <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-faint-foreground" />}
    </span>
  )
}

// Gaya pembungkus tile (dipakai <Link> atau <button>).
export const actionTileFrame =
  "flex min-h-14 w-full items-center rounded-md border-[1.5px] border-outline-subtle bg-sunken px-4 py-2.5 text-foreground outline-none transition-colors hover:border-outline focus-visible:ring-3 focus-visible:ring-ring/50"
