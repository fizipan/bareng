import { create } from "zustand"
import { randomPrompt } from "@/lib/content/prompts"
import { shareOrigin } from "@/lib/brand"
import { getFilter } from "@/lib/templates/filters"
import { DEFAULT_TEMPLATE_ID, getTemplate } from "@/lib/templates/builtin"
import { notify } from "@/lib/toast"
import { placeholderFrame } from "@/lib/session/demo"
import type { DevActions, Screen, SessionActions, SessionState } from "@/lib/session/types"

// Store sesi. Di M1 bagian "server" masih disimulasikan persis seperti logika
// prototipe (pasangan masuk otomatis, timer hitung mundur lokal). M2 mengganti
// fungsi bertanda SIMULASI dengan RPC Supabase + event realtime.

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const EMPTY_FRAMES = [null, null, null, null]

// Nama pasangan simulasi, sama dengan data contoh prototipe.
const DEMO_NAMES = { host: "Rara", guest: "Dimas" }

export function makeRoomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("")
}

export const roomUrl = (code: string) => `${shareOrigin()}/r/${code}`
export const resultUrl = (slug: string) => `${shareOrigin()}/p/${slug}`

function initialState(): SessionState {
  return {
    code: "",
    role: "host",
    screen: "undang",
    errorKind: "camera",
    conn: "ok",
    reconnectAttempt: 0,
    tier: "free",
    templateId: DEFAULT_TEMPLATE_ID,
    filterId: "none",
    sound: true,
    me: { name: "Kamu", ready: false },
    partner: null,
    shot: { idx: 0, phase: "idle", count: 3, prompt: "" },
    frames: [...EMPTY_FRAMES],
    retakeQueue: [],
    selected: [],
    paywall: { open: false, pendingTemplateId: null, paying: false },
    result: null,
  }
}

// Semua timer simulasi dikumpulkan supaya bisa dibatalkan saat pindah layar.
let timers: ReturnType<typeof setTimeout>[] = []
const clearTimers = () => {
  timers.forEach(clearTimeout)
  timers = []
}
const after = (ms: number, fn: () => void) => {
  timers.push(setTimeout(fn, ms))
}

const fullFrames = () => [0, 1, 2, 3].map(placeholderFrame)

// Room yang dibuat di tab ini. Supaya host tetap host walau halaman dimuat
// ulang (M2: peran datang dari server lewat auth.uid()).
const HOSTED_KEY = "bareng:hosted-room"
const rememberHosted = (code: string) => {
  try {
    sessionStorage.setItem(HOSTED_KEY, code)
  } catch {}
}
const isHosted = (code: string) => {
  try {
    return sessionStorage.getItem(HOSTED_KEY) === code
  } catch {
    return false
  }
}

function copyText(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {})
}

type Store = SessionState & SessionActions & DevActions

export const useSession = create<Store>()((set, get) => {
  const patchPartner = (patch: Partial<NonNullable<SessionState["partner"]>>) => {
    const partner = get().partner
    if (partner) set({ partner: { ...partner, ...patch } })
  }

  // SIMULASI: pasangan masuk room.
  const simulateJoin = () => {
    const s = get()
    if (s.partner?.joined) return
    set({ partner: { name: DEMO_NAMES.guest, ready: false, joined: true } })
    notify(`${DEMO_NAMES.guest} masuk`)
    after(1100, () => {
      if (get().screen === "undang") set({ screen: "izin" })
    })
  }

  // SIMULASI: di M2 jadwal shot datang dari server (`shot_scheduled`).
  const beginFrame = (idx: number) => {
    clearTimers()
    set({ shot: { idx, phase: "prompt", count: 3, prompt: randomPrompt(get().shot.prompt) } })
    after(1600, startCount)
  }

  const startCount = () => {
    clearTimers()
    const shot = get().shot
    set({ shot: { ...shot, phase: "count", count: 3 } })
    after(1000, () => set({ shot: { ...get().shot, count: 2 } }))
    after(2000, () => set({ shot: { ...get().shot, count: 1 } }))
    after(3000, () => set({ shot: { ...get().shot, phase: "flash" } }))
    after(3160, captureDone)
  }

  const captureDone = () => {
    const s = get()
    const idx = s.shot.idx
    const frames = s.frames.slice()
    frames[idx] = placeholderFrame(idx)
    const wasRetake = s.retakeQueue.length > 0
    const queue = s.retakeQueue.filter((n) => n !== idx)
    set({ frames, retakeQueue: queue, shot: { ...s.shot, phase: "saving" } })
    if (wasRetake) {
      if (queue.length) after(700, () => beginFrame(queue[0]))
      else after(400, () => set({ screen: "review", shot: { ...get().shot, phase: "idle" } }))
      return
    }
    if (idx < 3) after(900, () => beginFrame(idx + 1))
    else after(800, () => set({ screen: "review", shot: { ...get().shot, phase: "idle" } }))
  }

  const startSession = () => {
    set({ screen: "capture", frames: [...EMPTY_FRAMES], retakeQueue: [], selected: [] })
    beginFrame(0)
  }

  return {
    ...initialState(),

    // SIMULASI: di M2 memanggil RPC create_room lalu redirect ke /r/{code}.
    createRoom: () => {
      clearTimers()
      const code = makeRoomCode()
      set({ ...initialState(), code, role: "host", screen: "undang", sound: get().sound })
      rememberHosted(code)
      notify("Room dibuat")
      after(3600, simulateJoin)
      return code
    },

    // Dipanggil halaman /r/[code]. Kalau bukan room yang barusan dibuat di HP
    // ini, berarti datang dari link/kode → masuk sebagai tamu.
    enterRoom: (code) => {
      if (get().code === code) return
      clearTimers()
      if (isHosted(code)) {
        set({ ...initialState(), code, role: "host", screen: "undang" })
        after(3600, simulateJoin)
        return
      }
      set({
        ...initialState(),
        code,
        role: "guest",
        screen: "izin",
        partner: { name: DEMO_NAMES.host, ready: false, joined: true },
      })
      notify("Kamu masuk room")
    },

    fail: (kind) => {
      clearTimers()
      set({ screen: "error", errorKind: kind })
    },

    leave: () => {
      clearTimers()
      set(initialState())
    },

    backToInvite: () => {
      clearTimers()
      set({ screen: "undang", me: { ...get().me, ready: false } })
      patchPartner({ ready: false })
    },

    // M3: getUserMedia sungguhan.
    allowCamera: () => {
      clearTimers()
      set({ screen: "lobby", me: { ...get().me, ready: false } })
      patchPartner({ ready: false })
      notify("Kamera nyala")
    },
    denyCamera: () => {
      clearTimers()
      set({ screen: "error", errorKind: "camera" })
    },

    copyInviteLink: () => {
      copyText(roomUrl(get().code))
      notify("Link disalin")
    },
    shareWhatsApp: () => {
      const text = `Foto bareng yuk! Klik link ini, nggak perlu daftar: ${roomUrl(get().code)}`
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener")
    },

    setTemplate: (id) => {
      const t = getTemplate(id)
      if (t.tier === "premium" && get().tier !== "premium") {
        set({ paywall: { open: true, pendingTemplateId: t.id, paying: false } })
        return
      }
      if (get().templateId === t.id) return
      set({ templateId: t.id })
      notify("Template diganti — dia juga lihat")
    },
    setFilter: (id) => {
      set({ filterId: id })
      notify(`Filter: ${getFilter(id).name}`)
    },

    toggleReady: () => {
      const s = get()
      if (!s.partner?.joined) {
        notify("Dia belum masuk room")
        return
      }
      if (s.me.ready) {
        clearTimers()
        set({ me: { ...s.me, ready: false } })
        patchPartner({ ready: false })
        return
      }
      set({ me: { ...s.me, ready: true } })
      notify("Kamu siap")
      // SIMULASI: pasangan ikut siap, lalu server memulai sesi.
      after(1500, () => {
        patchPartner({ ready: true })
        after(700, startSession)
      })
    },

    skipPrompt: () => {
      if (get().shot.phase === "prompt") startCount()
    },

    toggleSelect: (idx) => {
      const sel = get().selected
      set({ selected: sel.includes(idx) ? sel.filter((n) => n !== idx) : [...sel, idx] })
    },
    clearSelect: () => set({ selected: [] }),
    retakeSelected: () => {
      const s = get()
      const queue = [...s.selected].sort((a, b) => a - b)
      if (!queue.length) return
      const frames = s.frames.slice()
      queue.forEach((i) => (frames[i] = null))
      set({ retakeQueue: queue, selected: [], frames, screen: "capture" })
      notify(queue.length > 1 ? `Ulang ${queue.length} foto` : `Ulang foto ${queue[0] + 1}`)
      beginFrame(queue[0])
    },
    retakeAll: () => startSession(),

    // M5: komposit canvas + unggah hasil.
    makeStrip: () => {
      clearTimers()
      set({ screen: "hasil", result: { slug: "contoh", createdAt: new Date().toISOString() } })
      notify("Photostrip kalian jadi")
    },
    download: () => notify(get().tier === "premium" ? "Photostrip tersimpan, kualitas tinggi" : "Tersimpan dengan watermark"),
    share: () => {
      const slug = get().result?.slug
      if (!slug) return
      const url = resultUrl(slug)
      if (navigator.share) {
        navigator.share({ title: "Photostrip kami", url }).catch(() => {})
        return
      }
      copyText(url)
      notify("Link hasil disalin")
    },
    copyResultLink: () => {
      const slug = get().result?.slug
      if (!slug) return
      copyText(resultUrl(slug))
      notify("Link hasil disalin")
    },
    deleteResult: () => notify("Foto dihapus"),

    openPaywall: () => set({ paywall: { open: true, pendingTemplateId: null, paying: false } }),
    closePaywall: () => {
      if (get().paywall.paying) return
      set({ paywall: { open: false, pendingTemplateId: null, paying: false } })
    },
    // M6: MockProvider + webhook → session_upgraded.
    pay: () => {
      const s = get()
      if (s.paywall.paying) return
      set({ paywall: { ...s.paywall, paying: true } })
      after(1900, () => {
        const pending = get().paywall.pendingTemplateId
        set({
          tier: "premium",
          templateId: pending ?? get().templateId,
          paywall: { open: false, pendingTemplateId: null, paying: false },
        })
        notify("Pembayaran berhasil — sesi jadi premium")
      })
    },

    toggleSound: () => {
      const sound = !get().sound
      set({ sound })
      notify(sound ? "Suara shutter nyala" : "Suara shutter mati")
    },

    errorAction: () => {
      const kind = get().errorKind
      if (kind === "camera") set({ screen: "izin" })
      if (kind === "putus") {
        set({ conn: "ok", reconnectAttempt: 0, screen: "lobby" })
        notify("Tersambung lagi")
      }
    },

    reset: () => {
      clearTimers()
      set(initialState())
    },

    // ── Dev ─────────────────────────────────────────────────────────────
    devJump: (screen: Screen) => {
      clearTimers()
      const s = get()
      const base: Partial<SessionState> = {
        code: s.code || makeRoomCode(),
        screen,
        me: { ...s.me, ready: false },
        partner: { name: s.role === "host" ? DEMO_NAMES.guest : DEMO_NAMES.host, ready: false, joined: screen !== "undang" },
        paywall: { open: false, pendingTemplateId: null, paying: false },
        shot: { ...s.shot, phase: "idle" },
        selected: [],
        retakeQueue: [],
      }
      if (screen === "capture") {
        set({ ...base, frames: [...EMPTY_FRAMES] })
        beginFrame(0)
        return
      }
      if (screen === "review" || screen === "hasil") base.frames = fullFrames()
      if (screen === "hasil") base.result = { slug: "contoh", createdAt: new Date().toISOString() }
      set(base)
    },
    devSetTier: (tier) => {
      set({ tier, paywall: { open: false, pendingTemplateId: null, paying: false } })
      notify(tier === "premium" ? "Sesi premium aktif" : "Sesi kembali gratis")
    },
    devSetConn: (conn) => {
      if (conn === "putus") {
        clearTimers()
        set({ conn, reconnectAttempt: 2, screen: "error", errorKind: "putus" })
        return
      }
      set({ conn, reconnectAttempt: 0 })
    },
    devSetError: (kind) => {
      clearTimers()
      set({ screen: "error", errorKind: kind })
    },
    devSimulateJoin: simulateJoin,
  }
})
