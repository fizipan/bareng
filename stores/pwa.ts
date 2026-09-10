import { create } from "zustand"

// Event non-standar Chromium untuk prompt pasang aplikasi.
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const SNOOZE_KEY = "bareng:install-snoozed-until"
const SNOOZE_DAYS = 14

type PwaState = {
  ready: boolean
  standalone: boolean
  ios: boolean
  installEvent: BeforeInstallPromptEvent | null
  sheetOpen: boolean
  openSheet: () => void
  closeSheet: (snooze?: boolean) => void
  install: () => Promise<"accepted" | "dismissed" | "unavailable">
}

export const usePwa = create<PwaState>()((set, get) => ({
  ready: false,
  standalone: false,
  ios: false,
  installEvent: null,
  sheetOpen: false,
  openSheet: () => set({ sheetOpen: true }),
  closeSheet: (snooze = false) => {
    if (snooze) {
      try {
        localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 86_400_000))
      } catch {}
    }
    set({ sheetOpen: false })
  },
  // Prompt bawaan Chromium. iOS tidak punya prompt; sheet menampilkan langkahnya.
  install: async () => {
    const { installEvent } = get()
    if (!installEvent) return "unavailable"
    await installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    set({ installEvent: null, sheetOpen: outcome === "accepted" ? false : get().sheetOpen })
    return outcome
  },
}))

// Pemicu pasang hanya muncul kalau memang bisa dipasang dan belum terpasang.
export const useCanInstall = () =>
  usePwa((s) => s.ready && !s.standalone && (s.installEvent !== null || s.ios))

// Sheet boleh terbuka otomatis kalau user belum menunda dalam 14 hari terakhir.
export function isInstallSnoozed() {
  try {
    return Number(localStorage.getItem(SNOOZE_KEY) ?? 0) > Date.now()
  } catch {
    return true
  }
}
