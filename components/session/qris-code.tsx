"use client"

import { useMemo } from "react"
import { encode } from "uqr"

// Kode QR pembayaran. Isinya bisa dua rupa: teks QRIS (kita render sendiri jadi
// satu path SVG, tajam di layar mana pun), atau URL gambar QR dari gateway —
// Midtrans membalas begitu, dan gambarnya tidak boleh kita bikin ulang.
export function QrisCode({ value, className }: { value: string; className?: string }) {
  const drawn = useMemo(() => {
    if (value.startsWith("https://")) return null
    const qr = encode(value, { ecc: "M", border: 2 })
    let d = ""
    qr.data.forEach((row, y) =>
      row.forEach((on, x) => {
        if (on) d += `M${x} ${y}h1v1h-1z`
      })
    )
    return { size: qr.size, path: d }
  }, [value])

  if (!drawn) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- gambar dari gateway, bukan aset kita
      <img src={value} alt="Kode QR pembayaran" width={196} height={196} className={className} />
    )
  }

  return (
    <svg
      viewBox={`0 0 ${drawn.size} ${drawn.size}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label="Kode QR pembayaran"
      className={className}
    >
      <rect width={drawn.size} height={drawn.size} fill="#ffffff" />
      <path d={drawn.path} fill="#16141D" />
    </svg>
  )
}
