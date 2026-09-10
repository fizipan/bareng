import { BRAND } from "@/lib/brand"
import { cn } from "@/lib/utils"

// Ikon: kotak shutter berisi strip kertas 3 sel (gelap–flash–gelap).
// Proporsi diambil dari ukuran 34 px di prototipe; ukuran lain diskalakan.
export function LogoMark({ size = 34, className }: { size?: number; className?: string }) {
  const s = size / 34
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center bg-shutter", className)}
      style={{ width: size, height: size, borderRadius: 10 * s }}
    >
      <span
        className="flex flex-col bg-kertas"
        style={{
          width: 14 * s,
          height: 24 * s,
          gap: Math.max(1.5, 2 * s),
          padding: Math.max(2, 2.5 * s),
          borderRadius: 2 * s,
        }}
      >
        <span className="flex-1 rounded-[1px] bg-darkroom" />
        <span className="flex-1 rounded-[1px] bg-flash" />
        <span className="flex-1 rounded-[1px] bg-darkroom" />
      </span>
    </span>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display leading-none font-extrabold tracking-[-0.01em]", className)}>
      {BRAND}
      <span className="text-shutter">.</span>
    </span>
  )
}

export function Logo({
  size = 34,
  tagline,
  className,
  wordmarkClassName,
}: {
  size?: number
  tagline?: string
  className?: string
  wordmarkClassName?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <span className="flex flex-col gap-px">
        <Wordmark className={cn("text-[21px]", wordmarkClassName)} />
        {tagline && <span className="text-micro text-muted-foreground">{tagline}</span>}
      </span>
    </span>
  )
}
