import { create } from "zustand"

// Modal bantuan (form masukan). Statusnya di luar HelpFab supaya layar lain —
// mis. keterangan "pembayaran masih dikembangkan" — bisa membukanya tanpa
// memutus sesi foto yang sedang jalan.
type Help = { open: boolean }

export const useHelp = create<Help>(() => ({ open: false }))
export const openHelp = () => useHelp.setState({ open: true })
export const setHelpOpen = (open: boolean) => useHelp.setState({ open })
