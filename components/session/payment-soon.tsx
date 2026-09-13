"use client"

import { MessageSquareIcon, WrenchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { openHelp } from "@/stores/help"

// Selama gateway pembayaran masih disiapkan (PAYMENTS_LIVE mati), setiap tombol
// bayar diganti kartu ini: jujur soal keadaannya, berterima kasih, lalu ajak
// kirim masukan. Dipakai di paywall, lembar kuota, dan halaman hasil publik.
export function PaymentSoon({ lead, onFeedback }: { lead?: string; onFeedback?: () => void }) {
  return (
    <div className="flex flex-col gap-3.5 rounded-md border-[1.5px] border-line-strong bg-sunken p-4">
      <div className="flex items-start gap-3">
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-flash/30 text-[#7A5E00]">
          <WrenchIcon className="size-[18px]" />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-label font-semibold">Pembayaran masih kami siapkan</span>
          <span className="text-small text-soft-foreground">
            {lead ?? "Sistem pembayarannya belum jalan, jadi premium belum bisa dibeli."} Makasih ya sudah pakai Bareng —
            cerita dong yang kurang enak atau yang kamu pengin ada.
          </span>
        </div>
      </div>
      <Button variant="secondary" onClick={onFeedback ?? openHelp}>
        <MessageSquareIcon data-icon="inline-start" />
        Kirim masukan
      </Button>
    </div>
  )
}
