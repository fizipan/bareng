import { LoaderCircleIcon, MicIcon, MicOffIcon, PencilIcon } from "lucide-react"
import { GhostFigure } from "@/components/art/figure"
import { Lens } from "@/components/art/lens"
import { cn } from "@/lib/utils"
import { LiveVideo } from "./live-video"

type TileState = "live" | "loading" | "waiting"

type TileMic = { on: boolean; busy?: boolean; onToggle?: () => void }

// Video tile PRD §15.5: feed kamera (atau pola placeholder di galeri dev),
// "Menunggu kamera…" saat memuat, siluet putus-putus saat dia belum masuk.
// Status mic tampil di dua tile: tombol di video kamu, penanda di video dia.
export function VideoTile({
  name,
  state = "live",
  stream,
  feed = "remote",
  placeholder,
  background,
  filter,
  onEditName,
  mic,
  className,
}: {
  name: string
  state?: TileState
  stream?: MediaStream | null
  feed?: "local" | "remote"
  placeholder?: string
  background?: string
  filter?: string
  onEditName?: () => void
  mic?: TileMic
  className?: string
}) {
  const filterStyle = filter && filter !== "none" ? { filter } : undefined

  return (
    <div
      className={cn(
        "relative aspect-[3/4] flex-1 overflow-hidden rounded-[8px] border border-[#2E2A3B] bg-kabin-sunken",
        state === "waiting" && "border-dashed border-kabin-line",
        className
      )}
    >
      {state === "live" &&
        (stream ? (
          <LiveVideo stream={stream} feed={feed} style={filterStyle} />
        ) : (
          <>
            <div className="absolute inset-0" style={{ background, ...filterStyle }} />
            {placeholder && (
              <div className="absolute inset-0 flex items-center justify-center px-2 text-center font-mono text-[10px] text-grain">
                {placeholder}
              </div>
            )}
          </>
        ))}
      {state === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-darkroom-2 text-caption text-grain">
          <Lens size={56} />
          Menunggu kamera…
        </div>
      )}
      {state === "waiting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center text-caption text-grain">
          <span aria-hidden className="animate-breathe">
            <GhostFigure className="size-16" />
          </span>
          Bagikan link ke dia
        </div>
      )}
      {state !== "waiting" &&
        (onEditName ? (
          <button
            type="button"
            onClick={onEditName}
            aria-label={`Ganti nama panggilan (${name})`}
            className="absolute top-2 left-2 inline-flex min-h-6 items-center gap-[5px] rounded-full bg-darkroom/75 px-[9px] py-1 text-micro text-kertas outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span aria-hidden className={cn("size-1.5 rounded-full", state === "live" ? "bg-ok" : "bg-grain")} />
            {name}
            <PencilIcon aria-hidden className="size-2.5 text-kabin-soft" />
          </button>
        ) : (
          <span className="absolute top-2 left-2 inline-flex items-center gap-[5px] rounded-full bg-darkroom/75 px-[9px] py-1 text-micro text-kertas">
            <span aria-hidden className={cn("size-1.5 rounded-full", state === "live" ? "bg-ok" : "bg-grain")} />
            {name}
          </span>
        ))}
      {mic && state === "live" && <MicPill name={name} {...mic} />}
    </div>
  )
}

function MicPill({ name, on, busy = false, onToggle }: TileMic & { name: string }) {
  const icon = busy ? (
    <LoaderCircleIcon aria-hidden className="size-3.5 animate-spin" />
  ) : on ? (
    <MicIcon aria-hidden className="size-3.5" />
  ) : (
    <MicOffIcon aria-hidden className="size-3.5 text-shutter-soft" />
  )
  const base =
    "absolute bottom-2 left-2 inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 py-1 text-micro font-semibold text-kertas backdrop-blur-sm"

  if (!onToggle) {
    return (
      <span role="status" className={cn(base, on ? "bg-ok/90" : "bg-darkroom/80")}>
        {icon}
        {on ? "Mic nyala" : "Mic mati"}
        <span className="sr-only"> ({name})</span>
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={busy}
      aria-pressed={on}
      aria-label={on ? "Matikan mikrofon" : "Nyalakan mikrofon"}
      className={cn(
        base,
        "cursor-pointer ring-1 outline-none transition-colors before:absolute before:-inset-2 before:content-[''] focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait",
        on ? "bg-ok/90 ring-ok hover:bg-ok" : "bg-darkroom/85 ring-kertas/25 hover:bg-darkroom"
      )}
    >
      {icon}
      {busy ? "Menyalakan…" : on ? "Mic nyala" : "Nyalakan mic"}
    </button>
  )
}
