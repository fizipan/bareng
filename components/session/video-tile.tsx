import { CameraIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type TileState = "live" | "loading" | "waiting"

// Video tile PRD §15.5. M1 masih pola placeholder; M3 mengganti isi "live"
// dengan <video> dari MediaStream.
export function VideoTile({
  name,
  state = "live",
  placeholder,
  background,
  filter,
  className,
}: {
  name: string
  state?: TileState
  placeholder?: string
  background?: string
  filter?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative aspect-[3/4] flex-1 overflow-hidden rounded-[8px] border border-[#2E2A3B] bg-kabin-sunken",
        state === "waiting" && "border-dashed border-kabin-line",
        className
      )}
    >
      {state === "live" && (
        <>
          <div className="absolute inset-0" style={{ background, filter: filter === "none" ? undefined : filter }} />
          {placeholder && (
            <div className="absolute inset-0 flex items-center justify-center px-2 text-center font-mono text-[10px] text-grain">
              {placeholder}
            </div>
          )}
        </>
      )}
      {state === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-darkroom-2 text-caption text-grain">
          <CameraIcon className="size-6" />
          Menunggu kamera…
        </div>
      )}
      {state === "waiting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-3 text-center text-caption text-grain">
          <span aria-hidden className="flex flex-col items-center gap-1 animate-blink">
            <span className="size-5 rounded-full border-[1.75px] border-dashed border-grain" />
            <span className="h-6 w-8 rounded-t-[10px] rounded-b-[3px] border-[1.75px] border-dashed border-grain" />
          </span>
          Bagikan link ke dia
        </div>
      )}
      {state !== "waiting" && (
        <span className="absolute top-2 left-2 inline-flex items-center gap-[5px] rounded-full bg-darkroom/75 px-[9px] py-1 text-micro text-kertas">
          <span aria-hidden className={cn("size-1.5 rounded-full", state === "live" ? "bg-ok" : "bg-grain")} />
          {name}
        </span>
      )}
    </div>
  )
}
