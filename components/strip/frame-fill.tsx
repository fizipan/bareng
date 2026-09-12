import { lookBackground } from "@/lib/templates/placeholder"
import type { FrameSource } from "@/lib/session/types"

// Isi setengah slot: foto asli, "masih dikirim", atau pola placeholder.
export function FrameFill({ source, side }: { source: FrameSource; side: "a" | "b" }) {
  if (source.kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt="" src={source.url} className="absolute inset-0 size-full object-cover" />
  }
  if (source.kind === "pending") {
    return (
      <div aria-label="Foto lagi dicetak" className="absolute inset-0 overflow-hidden bg-darkroom-2">
        <span aria-hidden className="absolute inset-0 animate-develop bg-darkroom" style={{ animationDuration: "1.6s", animationIterationCount: "infinite", animationDirection: "alternate" }} />
      </div>
    )
  }
  return <div className="absolute inset-0" style={{ background: lookBackground(source.look, side) }} />
}
