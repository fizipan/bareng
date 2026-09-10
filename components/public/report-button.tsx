"use client"

import { Button } from "@/components/ui/button"
import { notify } from "@/lib/toast"

// M5: kirim ke tabel reports.
export function ReportButton() {
  return (
    <Button variant="ghost" size="inline" className="text-meta font-normal" onClick={() => notify("Laporan terkirim")}>
      Laporkan halaman ini
    </Button>
  )
}
