import { create } from "zustand"

// Lembar "sesi gratis hari ini habis" (PRD: 3 sesi/hari per perangkat).
// `start` membuat room sesi premium lalu pindah ke sana; dipakai semua tombol
// bikin room (landing, gabung, layar error, shortcut aplikasi).
type Quota = { open: boolean; start: (() => Promise<void>) | null }

export const useQuota = create<Quota>(() => ({ open: false, start: null }))
export const openQuota = (start: () => Promise<void>) => useQuota.setState({ open: true, start })
export const closeQuota = () => useQuota.setState({ open: false, start: null })
