"use client"

import { TemplateThumb } from "@/components/strip/template-thumb"
import { BUILTIN_TEMPLATES } from "@/lib/templates/builtin"
import { cn } from "@/lib/utils"

// Carousel horizontal thumbnail strip; aktif ber-border shutter, premium ber-badge.
export function TemplatePicker({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (id: string) => void
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Template"
      className={cn("-mx-5 flex gap-2.5 overflow-x-auto px-5 pt-1 pb-2 [scrollbar-width:none]", className)}
    >
      {BUILTIN_TEMPLATES.map((t) => {
        const selected = value === t.id
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(t.id)}
            className="flex w-[78px] shrink-0 flex-col gap-1.5 rounded-sm text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <TemplateThumb template={t} selected={selected} showBadge />
            <span className={cn("text-caption", selected ? "text-foreground" : "text-faint-foreground")}>{t.name}</span>
          </button>
        )
      })}
    </div>
  )
}
