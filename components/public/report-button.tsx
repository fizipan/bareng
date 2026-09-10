"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { notify, warn } from "@/lib/toast"

// Laporan konten dari halaman publik (tanpa perlu login).
export function ReportButton({ slug }: { slug: string }) {
  const [sent, setSent] = useState(false)
  return (
    <Button
      variant="ghost"
      size="inline"
      className="text-meta font-normal"
      disabled={sent}
      onClick={async () => {
        const { error } = await supabase().rpc("report_result", { p_slug: slug })
        if (error) {
          warn("Laporan belum terkirim, coba lagi")
          return
        }
        setSent(true)
        notify("Laporan terkirim")
      }}
    >
      {sent ? "Sudah dilaporkan" : "Laporkan halaman ini"}
    </Button>
  )
}
