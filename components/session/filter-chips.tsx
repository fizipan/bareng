"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { FILTERS, type FilterId } from "@/lib/templates/filters"

export function FilterChips({ value, onChange }: { value: FilterId; onChange: (id: FilterId) => void }) {
  return (
    <ToggleGroup
      aria-label="Filter"
      variant="chip"
      size="chip"
      value={[value]}
      onValueChange={(next) => {
        // Satu filter selalu aktif; ketuk ulang chip yang sama tidak mengosongkan.
        if (next[0]) onChange(next[0] as FilterId)
      }}
      className="flex-wrap"
    >
      {FILTERS.map((f) => (
        <ToggleGroupItem key={f.id} value={f.id}>
          {f.name}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
