"use client"

import { useMemo } from "react"
import { encode } from "uqr"

// Kode QR dari isi QRIS: satu path SVG, tajam di layar mana pun.
export function QrisCode({ value, className }: { value: string; className?: string }) {
  const { size, path } = useMemo(() => {
    const qr = encode(value, { ecc: "M", border: 2 })
    let d = ""
    qr.data.forEach((row, y) =>
      row.forEach((on, x) => {
        if (on) d += `M${x} ${y}h1v1h-1z`
      })
    )
    return { size: qr.size, path: d }
  }, [value])

  return (
    <svg viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges" role="img" aria-label="Kode QR pembayaran" className={className}>
      <rect width={size} height={size} fill="#ffffff" />
      <path d={path} fill="#16141D" />
    </svg>
  )
}
