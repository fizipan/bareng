import type { StripTemplate } from "@/lib/templates/schema"
import { lookBackground } from "@/lib/templates/placeholder"
import { cn } from "@/lib/utils"
import { fillTokens } from "@/lib/templates/tokens"

// Thumbnail ringkas template (prototipe `mini()`): bukan skala penuh, cukup
// ciri visualnya — kertas, sprocket, pita, bingkai slot, catatan kecil.
export function TemplateThumb({
  template,
  size = "picker",
  selected = false,
  showBadge = false,
  className,
}: {
  template: StripTemplate
  size?: "picker" | "landing"
  selected?: boolean
  showBadge?: boolean
  className?: string
}) {
  const { preview } = template
  const twoCols = preview.cols === 2
  const landing = size === "landing"
  const slotH = twoCols ? 17 : 22
  return (
    <div
      className={cn(
        "relative flex flex-col gap-[3px]",
        landing ? "border border-line px-2 pt-[7px] pb-[17px]" : "rounded-sm border-2 px-[7px] pt-1.5 pb-3.5",
        !landing && (selected ? "border-shutter" : "border-transparent"),
        className
      )}
      style={{ background: template.background.value }}
    >
      {preview.sprockets && (
        <>
          <span aria-hidden className="absolute top-1.5 bottom-1.5 left-[3px] w-[3px] bg-[repeating-linear-gradient(180deg,rgba(22,20,29,.2)_0_4px,transparent_4px_9px)]" />
          <span aria-hidden className="absolute top-1.5 right-[3px] bottom-1.5 w-[3px] bg-[repeating-linear-gradient(180deg,rgba(22,20,29,.2)_0_4px,transparent_4px_9px)]" />
        </>
      )}
      {preview.band && <span aria-hidden className="h-1" style={{ background: preview.band }} />}
      <div className={cn("grid", twoCols ? "grid-cols-2 gap-[3px]" : "grid-cols-1 gap-1")}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="block"
            style={{
              height: slotH,
              background: lookBackground(i % 2, i % 2 ? "b" : "a"),
              border: preview.slotBorder ? `1.5px solid ${preview.slotBorder}` : undefined,
            }}
          />
        ))}
      </div>
      <span
        className={cn(
          "absolute max-w-[calc(100%-14px)] overflow-hidden font-display leading-none font-semibold whitespace-nowrap",
          landing ? "bottom-[5px] left-2 text-[9px]" : "bottom-1 left-[7px] text-[8px]"
        )}
        style={{ color: preview.noteColor }}
      >
        {fillTokens(preview.note, { date: "", host: "" })}
      </span>
      {showBadge && template.tier === "premium" && (
        <span className="absolute top-1 right-1 rounded-sm bg-flash px-1.5 py-0.5 text-[9px] leading-none font-semibold text-darkroom">
          Premium
        </span>
      )}
    </div>
  )
}
