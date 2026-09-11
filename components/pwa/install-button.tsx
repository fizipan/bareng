"use client"

import { useEffect } from "react"
import { LogoMark } from "@/components/brand/logo"
import { ActionTile, actionTileFrame } from "@/components/common/action-tile"
import { isInstallSnoozed, useCanInstall, usePwa } from "@/stores/pwa"

// Semua pemicu hanya membuka bottom sheet pasang (install-sheet.tsx) dan hanya
// tampil kalau aplikasi memang bisa dipasang & belum terpasang.

// Item daftar di footer (mode gelap).
export function InstallFooterLink() {
  const canInstall = useCanInstall()
  const openSheet = usePwa((s) => s.openSheet)
  if (!canInstall) return null
  return (
    <li>
      <button
        type="button"
        onClick={openSheet}
        className="text-left text-kertas/90 underline-offset-4 hover:text-kertas hover:underline"
      >
        Pasang aplikasi
      </button>
    </li>
  )
}

// Tile di "Lanjut ke mana?" layar Hasil. Setelah sesi pertama selesai, sheet
// juga terbuka sendiri sekali (PRD P1: ajakan pasang setelah sesi pertama).
export function InstallTile({ autoOpen = false }: { autoOpen?: boolean }) {
  const canInstall = useCanInstall()
  const openSheet = usePwa((s) => s.openSheet)

  useEffect(() => {
    if (!autoOpen || !canInstall || isInstallSnoozed()) return
    // Tunggu strip selesai keluar dari mesin dulu.
    const t = setTimeout(openSheet, 2200)
    return () => clearTimeout(t)
  }, [autoOpen, canInstall, openSheet])

  if (!canInstall) return null
  return (
    <button type="button" className={actionTileFrame} onClick={openSheet}>
      <ActionTile
        icon={<LogoMark size={32} />}
        iconClassName="bg-transparent"
        title="Pasang aplikasi"
        description="Buka Bareng langsung dari layar utama"
      />
    </button>
  )
}
