import type { CSSProperties, ReactNode } from "react"
import type { StripOverlay, StripTemplate, StripText } from "@/lib/templates/schema"
import { fillTokens, type StripTokens } from "@/lib/templates/tokens"
import { cn } from "@/lib/utils"

export type Side = "a" | "b"

const FONT: Record<StripText["font"], string> = {
  display: "var(--font-bricolage), var(--font-inter), sans-serif",
  sans: "var(--font-inter), sans-serif",
  mono: "ui-monospace, Menlo, monospace",
}

// Render DOM dari template JSON. Posisi dalam %, ukuran dalam cqw, jadi strip
// bisa ditampilkan di lebar berapa pun dan tetap sama persis dengan hasil PNG.
export function Strip({
  template,
  tokens,
  watermark = false,
  filter,
  renderHalf,
  renderSlot,
  slotClassName,
  shadow,
  className,
  style,
  children,
}: {
  template: StripTemplate
  tokens: StripTokens
  watermark?: boolean
  filter?: string
  renderHalf?: (index: number, side: Side) => ReactNode
  renderSlot?: (index: number) => ReactNode
  slotClassName?: (index: number) => string | undefined
  shadow?: "strip" | "strip-dark"
  className?: string
  style?: CSSProperties
  children?: ReactNode
}) {
  const { width: W, height: H } = template.canvas
  const px = (v: number) => `${(v / W) * 100}%`
  const py = (v: number) => `${(v / H) * 100}%`
  const u = (v: number) => `${(v / W) * 100}cqw`
  const halfStyle: CSSProperties | undefined = filter && filter !== "none" ? { filter } : undefined

  return (
    <div
      className={cn(
        "relative overflow-hidden select-none",
        shadow === "strip" && "shadow-strip",
        shadow === "strip-dark" && "shadow-strip-dark",
        className
      )}
      style={{
        aspectRatio: `${W} / ${H}`,
        containerType: "inline-size",
        background: template.background.value,
        color: template.ink,
        ...style,
      }}
    >
      {template.overlays.map((o, i) => (
        <Overlay key={i} overlay={o} px={px} py={py} u={u} />
      ))}

      {template.slots.map((slot) => (
        <div
          key={slot.index}
          className={cn("absolute flex", slotClassName?.(slot.index))}
          style={{
            left: px(slot.x),
            top: py(slot.y),
            width: px(slot.w),
            height: py(slot.h),
            gap: u(slot.gap),
            background: slot.background,
            border: slot.border ? `${u(slot.border.width)} solid ${slot.border.color}` : undefined,
            borderRadius: slot.radius ? u(slot.radius) : undefined,
          }}
        >
          {(["a", "b"] as const).map((side) => (
            <div key={side} className="relative flex-1 overflow-hidden" style={halfStyle}>
              {renderHalf?.(slot.index, side)}
            </div>
          ))}
          {renderSlot?.(slot.index)}
        </div>
      ))}

      {template.text.map((t) => (
        <TextItem key={t.key} text={t} value={fillTokens(t.value, tokens)} W={W} H={H} u={u} />
      ))}

      {watermark && (
        <TextItem
          text={{
            key: "watermark",
            x: template.watermark.x,
            y: template.watermark.y,
            baseline: "bottom",
            align: "right",
            size: template.watermark.size,
            font: "sans",
            weight: 400,
            color: template.watermark.color,
            value: "{{host}}",
          }}
          value={tokens.host}
          W={W}
          H={H}
          u={u}
        />
      )}

      {children}
    </div>
  )
}

function Overlay({
  overlay: o,
  px,
  py,
  u,
}: {
  overlay: StripOverlay
  px: (v: number) => string
  py: (v: number) => string
  u: (v: number) => string
}) {
  switch (o.type) {
    case "rect":
      return (
        <div
          aria-hidden
          className="absolute"
          style={{ left: px(o.x), top: py(o.y), width: px(o.w), height: py(o.h), background: o.color }}
        />
      )
    case "sprockets":
      return (
        <div
          aria-hidden
          className="absolute"
          style={{
            left: px(o.x),
            top: py(o.y),
            width: px(o.w),
            height: py(o.h),
            background: `repeating-linear-gradient(180deg, ${o.color} 0 ${u(o.hole)}, transparent ${u(o.hole)} ${u(o.pitch)})`,
          }}
        />
      )
    case "heart":
      return (
        <div
          aria-hidden
          className="absolute rotate-45"
          style={{
            left: px(o.x),
            top: py(o.y),
            width: u(o.size),
            height: u(o.size),
            background: o.color,
            borderRadius: `9999px 9999px ${u(o.size * 0.22)} 9999px`,
          }}
        />
      )
    case "image":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          src={o.src}
          className="absolute"
          style={{ left: px(o.x), top: py(o.y), width: px(o.w), height: py(o.h) }}
        />
      )
  }
}

function TextItem({
  text: t,
  value,
  W,
  H,
  u,
}: {
  text: StripText
  value: string
  W: number
  H: number
  u: (v: number) => string
}) {
  const style: CSSProperties = {
    fontFamily: FONT[t.font],
    fontWeight: t.weight,
    fontSize: u(t.size),
    lineHeight: 1,
    color: t.color,
    whiteSpace: "nowrap",
  }
  const transforms: string[] = []
  if (t.align === "left") style.left = `${(t.x / W) * 100}%`
  if (t.align === "right") style.right = `${((W - t.x) / W) * 100}%`
  if (t.align === "center") {
    style.left = `${(t.x / W) * 100}%`
    transforms.push("translateX(-50%)")
  }
  if (t.baseline === "bottom") style.bottom = `${((H - t.y) / H) * 100}%`
  if (t.baseline === "middle") {
    style.top = `${(t.y / H) * 100}%`
    transforms.push("translateY(-50%)")
  }
  if (transforms.length) style.transform = transforms.join(" ")
  return (
    <span aria-hidden className="absolute" style={style}>
      {value}
    </span>
  )
}
