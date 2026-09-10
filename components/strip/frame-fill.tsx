import { lookBackground } from "@/lib/templates/placeholder"
import type { FrameSource } from "@/lib/session/types"

// Isi setengah slot: foto asli atau pola placeholder.
export function FrameFill({ source, side }: { source: FrameSource; side: "a" | "b" }) {
  if (source.kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt="" src={source.url} className="absolute inset-0 size-full object-cover" />
  }
  return <div className="absolute inset-0" style={{ background: lookBackground(source.look, side) }} />
}
