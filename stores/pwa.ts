import { create } from "zustand"

// Event non-standar Chromium untuk prompt pasang aplikasi.
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

type PwaState = {
  ready: boolean
  standalone: boolean
  ios: boolean
  installEvent: BeforeInstallPromptEvent | null
  iosSheetOpen: boolean
  setIosSheetOpen: (open: boolean) => void
  install: () => Promise<"accepted" | "dismissed" | "ios" | "unavailable">
}

export const usePwa = create<PwaState>()((set, get) => ({
  ready: false,
  standalone: false,
  ios: false,
  installEvent: null,
  iosSheetOpen: false,
  setIosSheetOpen: (open) => set({ iosSheetOpen: open }),
  install: async () => {
    const { installEvent, ios } = get()
    if (installEvent) {
      await installEvent.prompt()
      const { outcome } = await installEvent.userChoice
      set({ installEvent: null })
      return outcome
    }
    // iOS tidak punya prompt: tampilkan panduan "Tambah ke Layar Utama".
    if (ios) {
      set({ iosSheetOpen: true })
      return "ios"
    }
    return "unavailable"
  },
}))

// Tombol pasang hanya muncul kalau memang bisa dipasang dan belum terpasang.
export const useCanInstall = () =>
  usePwa((s) => s.ready && !s.standalone && (s.installEvent !== null || s.ios))
