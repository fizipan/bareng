import { create } from "zustand"
import { shareOrigin } from "@/lib/brand"
import type { ErrorKind } from "@/lib/content/errors"
import { randomPrompt } from "@/lib/content/prompts"
import { CameraError, cameraPermission } from "@/lib/rtc/media"
import { signalSchema } from "@/lib/rtc/peer"
import { api, RoomError } from "@/lib/session/api"
import { joinRoomChannel, type RoomChannel } from "@/lib/session/channel"
import { placeholderFrame } from "@/lib/session/demo"
import {
  deriveView,
  partnerEventMessage,
  shotPhase,
  type Camera,
  type RoomEvent,
  type RoomSnapshot,
} from "@/lib/session/room-state"
import type { DevActions, Screen, SessionActions, SessionState } from "@/lib/session/types"
import { measureOffset } from "@/lib/sync/clock"
import { getFilter } from "@/lib/templates/filters"
import { DEFAULT_TEMPLATE_ID, getTemplate } from "@/lib/templates/builtin"
import { notify, warn } from "@/lib/toast"
import { media, useMedia } from "@/stores/media"

// Store sesi. Sumber kebenaran = server (RPC Supabase + broadcast realtime
// `room_state`); store menurunkan layar dari snapshot + keadaan lokal
// perangkat (izin kamera, sambungan video, layar undang). Kamera & WebRTC ada
// di stores/media.ts. Aksi dev* hanya untuk /dev/screens.

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const EMPTY_FRAMES = [null, null, null, null]
const PARTNER_GRACE_MS = 3000

export function makeRoomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("")
}

export const roomUrl = (code: string) => `${shareOrigin()}/r/${code}`
export const resultUrl = (slug: string) => `${shareOrigin()}/p/${slug}`

type Local = {
  roomId: string | null
  participantId: string | null
  camera: Camera
  showInvite: boolean
  partnerOnline: boolean
  // Izin kamera sudah pernah diberikan → kamera dinyalakan tanpa menunggu klik.
  autoCamera: boolean
  snapshot: RoomSnapshot | null
}

function initialState(): SessionState & Local {
  return {
    code: "",
    role: "host",
    screen: "connecting",
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
    roomId: null,
    participantId: null,
    camera: "unknown",
    showInvite: false,
    partnerOnline: true,
    autoCamera: false,
    snapshot: null,
  }
}

// ── Koneksi & jam (di luar React supaya bertahan saat pindah layar) ─────────
let unsubscribe: (() => void) | null = null
let clockOffset = 0
let ticker: ReturnType<typeof setInterval> | null = null
let reportedShot = ""
let partnerTimer: ReturnType<typeof setTimeout> | null = null
let connectingCode = ""
// Naik tiap masuk/keluar room; enterRoom lama yang masih jalan berhenti sendiri.
let generation = 0

function copyText(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {})
}

function errorKindOf(e: unknown): ErrorKind {
  return e instanceof RoomError && e.kind ? e.kind : "jaringan"
}

type Internal = { resync: () => Promise<void>; refresh: () => void }
type Store = SessionState & Local & SessionActions & DevActions & Internal

export const useSession = create<Store>()((set, get) => {
  // Hitung ulang layar dari snapshot terakhir + keadaan lokal.
  const recompute = (event: RoomEvent | null = null) => {
    const s = get()
    if (!s.snapshot || !s.participantId) return
    const view = deriveView(s.snapshot, {
      participantId: s.participantId,
      camera: s.camera,
      showInvite: s.showInvite,
      partnerOnline: s.partnerOnline,
      link: useMedia.getState().link,
    })
    const leavingReview = s.screen === "review" && view.screen !== "review"
    set({
      code: view.code,
      role: view.role,
      screen: view.screen,
      errorKind: view.errorKind ?? s.errorKind,
      tier: view.tier,
      templateId: view.templateId,
      filterId: view.filterId as SessionState["filterId"],
      me: view.me,
      partner: view.partner,
      frames: view.frames,
      retakeQueue: view.retakeQueue,
      result: view.result,
      conn: view.conn,
      reconnectAttempt: view.reconnectAttempt,
      selected: leavingReview ? [] : s.selected,
    })
    // Sesi selesai: kamera & sambungan video tidak dibutuhkan lagi.
    if (view.screen === "hasil" && useMedia.getState().local) media.stop()
    if (event?.by && event.by !== s.participantId) {
      const msg = partnerEventMessage(event, view.partner?.name ?? "Dia", (id) => getTemplate(id).name)
      if (msg) notify(msg)
    }
    syncTicker()
  }

  const applySnapshot = (snap: RoomSnapshot, event: RoomEvent | null) => {
    set({ snapshot: snap })
    recompute(event)
  }

  const resync = async () => {
    const roomId = get().roomId
    if (!roomId) return
    try {
      applySnapshot(await api.getRoom(roomId), null)
    } catch {}
  }

  const onPresence = (ids: string[]) => {
    const partnerId = get().partner?.id
    const online = !partnerId || ids.includes(partnerId)
    if (partnerTimer) clearTimeout(partnerTimer)
    if (online) {
      set({ partnerOnline: true })
      recompute()
      return
    }
    // Beri jeda sebelum menyatakan putus (refresh / pindah jaringan singkat).
    partnerTimer = setTimeout(() => {
      set({ partnerOnline: false })
      recompute()
    }, PARTNER_GRACE_MS)
  }

  // Detak 50 ms selama sesi foto: fase UI dari jadwal server, lapor saat capture.
  const tick = () => {
    const s = get()
    const snap = s.snapshot
    const shot = snap?.current_shot
    if (!snap || !shot || snap.status !== "capturing") return
    const now = Date.now() + clockOffset
    const { phase, count } = shotPhase(shot, now, snap.frames.length > 0)
    if (phase !== s.shot.phase || count !== s.shot.count || shot.idx !== s.shot.idx || shot.prompt !== s.shot.prompt) {
      set({ shot: { idx: shot.idx, phase, count, prompt: shot.prompt } })
    }
    const key = `${snap.id}:${shot.idx}:${shot.v}`
    if (now >= shot.capture_at && reportedShot !== key) {
      reportedShot = key
      // M4: ambil frame dari kamera lokal di sini, lalu unggah.
      api.frameCaptured(snap.id, shot.idx, shot.v, now).catch(() => {
        reportedShot = ""
      })
    }
  }

  const syncTicker = () => {
    const snap = get().snapshot
    if (snap?.status === "capturing" && snap.current_shot) {
      if (!ticker) ticker = setInterval(tick, 50)
      tick()
    } else {
      if (ticker) clearInterval(ticker)
      ticker = null
      if (get().shot.phase !== "idle") set({ shot: { ...get().shot, phase: "idle" } })
    }
  }

  const disconnect = () => {
    unsubscribe?.()
    unsubscribe = null
    media.disconnect()
    if (ticker) clearInterval(ticker)
    ticker = null
    if (partnerTimer) clearTimeout(partnerTimer)
    reportedShot = ""
  }

  const guard = async (fn: () => Promise<unknown>, fallback = "Gagal, coba lagi") => {
    try {
      await fn()
    } catch (e) {
      warn(e instanceof RoomError && e.code === "premium_required" ? "Template ini khusus premium" : fallback)
      resync()
    }
  }

  const room = () => get().roomId as string

  // Simulasi loop foto untuk galeri dev (tanpa server).
  const devBeginFrame = (idx: number) => {
    set({ shot: { idx, phase: "prompt", count: 3, prompt: randomPrompt(get().shot.prompt) } })
    const live = () => !get().snapshot && get().screen === "capture"
    setTimeout(() => {
      if (!live()) return
      set({ shot: { ...get().shot, phase: "count", count: 3 } })
      setTimeout(() => live() && set({ shot: { ...get().shot, count: 2 } }), 1000)
      setTimeout(() => live() && set({ shot: { ...get().shot, count: 1 } }), 2000)
      setTimeout(() => live() && set({ shot: { ...get().shot, phase: "flash" } }), 3000)
      setTimeout(() => {
        if (!live()) return
        const frames = get().frames.slice()
        frames[idx] = placeholderFrame(idx)
        set({ frames, shot: { ...get().shot, phase: "saving" } })
        if (idx < 3) setTimeout(() => live() && devBeginFrame(idx + 1), 900)
        else setTimeout(() => live() && set({ screen: "review" }), 800)
      }, 3160)
    }, 1600)
  }

  return {
    ...initialState(),

    resync,
    refresh: () => recompute(),

    createRoom: async () => {
      const { code } = await api.createRoom()
      return code
    },

    // Dipanggil halaman /r/[code]: join (atau masuk ulang), dengarkan channel,
    // lalu siapkan sambungan video ke pasangan.
    enterRoom: async (code) => {
      const s = get()
      if ((s.code === code && s.roomId && unsubscribe) || connectingCode === code) return
      const my = ++generation
      connectingCode = code
      disconnect()
      set({ ...initialState(), code, sound: s.sound })
      try {
        const joined = await api.joinRoom(code)
        if (my !== generation) return
        set({ roomId: joined.room_id, participantId: joined.participant_id, role: joined.role })
        const [snap, permission] = await Promise.all([api.getRoom(joined.room_id), cameraPermission()])
        if (my !== generation) return
        set({ autoCamera: permission === "granted" })
        applySnapshot(snap, null)

        let room: RoomChannel | null = null
        media.connect({
          selfId: joined.participant_id,
          polite: joined.role === "guest",
          send: (signal) => room?.send("signal", signal),
        })
        room = await joinRoomChannel(joined.room_id, joined.participant_id, {
          onState: applySnapshot,
          onPresence,
          onResync: resync,
          onSignal: (payload) => {
            const signal = signalSchema.safeParse(payload)
            if (signal.success) media.signal(signal.data)
          },
          onSubscribed: () => media.announce(),
        })
        if (my !== generation) {
          room.leave()
          return
        }
        unsubscribe = room.leave
        measureOffset(api.serverNow).then((o) => {
          clockOffset = o
        })
      } catch (e) {
        if (my === generation) set({ screen: "error", errorKind: errorKindOf(e) })
      } finally {
        if (my === generation) connectingCode = ""
      }
    },

    fail: (kind) => set({ screen: "error", errorKind: kind }),

    leave: () => {
      const roomId = get().roomId
      if (roomId) api.leaveRoom(roomId).catch(() => {})
      generation++
      connectingCode = ""
      disconnect()
      media.stop()
      set(initialState())
    },

    backToInvite: () => {
      if (get().role === "host") {
        set({ showInvite: true })
        recompute()
      }
    },
    closeInvite: () => {
      set({ showInvite: false })
      recompute()
    },

    setNickname: (name) => {
      guard(() => api.setNickname(room(), name))
    },

    // getUserMedia dipanggil dari klik (quirk iOS), atau otomatis kalau izin
    // sudah pernah diberikan.
    allowCamera: async () => {
      if (!get().roomId) {
        set({ screen: "lobby" }) // galeri dev: tanpa kamera sungguhan
        return
      }
      try {
        await media.openCamera()
        set({ camera: "granted" })
        recompute()
      } catch (e) {
        const reason = e instanceof CameraError ? e.reason : "unknown"
        const soft = {
          busy: "Kamera lagi dipakai aplikasi lain. Tutup dulu, lalu coba lagi.",
          missing: "Kamera nggak ketemu di perangkat ini",
          insecure: "Kamera cuma bisa nyala lewat https",
        } as Partial<Record<typeof reason, string>>
        if (soft[reason]) {
          warn(soft[reason])
          return
        }
        set({ camera: "denied", autoCamera: false })
        recompute()
      }
    },
    denyCamera: () => {
      set({ camera: "denied" })
      recompute()
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
      const s = get()
      if (t.tier === "premium" && s.tier !== "premium") {
        set({ paywall: { open: true, pendingTemplateId: t.id, paying: false } })
        return
      }
      if (s.templateId === t.id) return
      set({ templateId: t.id })
      notify("Template diganti — dia juga lihat")
      if (s.roomId) guard(() => api.setTemplate(room(), t.id))
    },
    setFilter: (id) => {
      if (get().filterId === id) return
      set({ filterId: id })
      notify(`Filter: ${getFilter(id).name}`)
      if (get().roomId) guard(() => api.setFilter(room(), id))
    },

    toggleReady: () => {
      const s = get()
      if (!s.partner?.joined) {
        notify("Dia belum masuk room")
        return
      }
      const ready = !s.me.ready
      set({ me: { ...s.me, ready } })
      if (ready) notify("Kamu siap")
      if (s.roomId) guard(() => api.setReady(room(), ready))
    },

    skipPrompt: () => {
      const shot = get().snapshot?.current_shot
      if (get().shot.phase !== "prompt" || !shot) return
      guard(() => api.skipPrompt(room(), shot.v))
    },

    toggleSelect: (idx) => {
      const sel = get().selected
      set({ selected: sel.includes(idx) ? sel.filter((n) => n !== idx) : [...sel, idx] })
    },
    clearSelect: () => set({ selected: [] }),
    retakeSelected: () => {
      const queue = [...get().selected].sort((a, b) => a - b)
      if (!queue.length) return
      set({ selected: [] })
      notify(queue.length > 1 ? `Ulang ${queue.length} foto` : `Ulang foto ${queue[0] + 1}`)
      if (get().roomId) guard(() => api.requestRetake(room(), queue))
    },
    retakeAll: () => {
      notify("Ulang semua foto")
      if (get().roomId) guard(() => api.requestRetake(room(), [0, 1, 2, 3]))
    },

    // M5: komposit canvas + unggah hasil.
    makeStrip: () => {
      notify("Photostrip kalian jadi")
      if (get().roomId) guard(() => api.finishSession(room()))
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
    deleteResult: async () => {
      const slug = get().result?.slug
      if (slug && get().roomId) await api.deleteResult(slug)
      notify("Foto dihapus")
    },

    openPaywall: () => set({ paywall: { open: true, pendingTemplateId: null, paying: false } }),
    closePaywall: () => {
      if (get().paywall.paying) return
      set({ paywall: { open: false, pendingTemplateId: null, paying: false } })
    },
    // M6: MockProvider + webhook → session_upgraded. Sekarang langsung upgrade room.
    pay: async () => {
      const s = get()
      if (s.paywall.paying) return
      set({ paywall: { ...s.paywall, paying: true } })
      try {
        if (s.roomId) {
          await api.mockUpgrade(room())
          const pending = get().paywall.pendingTemplateId
          if (pending) await api.setTemplate(room(), pending)
        } else {
          set({ tier: "premium", templateId: get().paywall.pendingTemplateId ?? get().templateId })
        }
        set({ paywall: { open: false, pendingTemplateId: null, paying: false } })
        notify("Pembayaran berhasil — sesi jadi premium")
      } catch {
        set({ paywall: { ...get().paywall, paying: false } })
        warn("Pembayaran belum berhasil, foto kalian tetap aman")
      }
    },

    toggleSound: () => {
      const sound = !get().sound
      set({ sound })
      notify(sound ? "Suara shutter nyala" : "Suara shutter mati")
    },

    errorAction: () => {
      const s = get()
      if (s.errorKind === "camera") {
        // Setelah ikut panduan: minta kamera lagi.
        if (!s.snapshot) return set({ screen: "izin" })
        set({ camera: "unknown" })
        get().allowCamera()
      } else if (s.errorKind === "putus") {
        if (!s.snapshot) return set({ conn: "ok", reconnectAttempt: 0, screen: "lobby" })
        media.reconnect()
        resync()
      } else if (s.errorKind === "jaringan" && s.code) {
        const code = s.code
        set({ code: "" })
        get().enterRoom(code)
      }
    },

    // "Foto lagi" / pindah halaman: lepas koneksi & kamera tanpa menutup room
    // (pasangan masih bisa lihat hasil atau kembali lagi).
    reset: () => {
      generation++
      connectingCode = ""
      disconnect()
      media.stop()
      set(initialState())
    },

    // ── Dev (/dev/screens): isi state langsung, pasangan & foto disimulasikan ──
    devJump: (screen: Screen) => {
      disconnect()
      const s = get()
      const base: Partial<SessionState & Local> = {
        code: s.code || makeRoomCode(),
        screen,
        snapshot: null,
        roomId: null,
        participantId: null,
        me: { ...s.me, ready: false },
        partner: { name: s.role === "host" ? "Dimas" : "Rara", ready: false, joined: screen !== "undang" },
        paywall: { open: false, pendingTemplateId: null, paying: false },
        shot: { ...s.shot, phase: "idle" },
        selected: [],
        retakeQueue: [],
      }
      if (screen === "capture") {
        set({ ...base, frames: [...EMPTY_FRAMES] })
        devBeginFrame(0)
        return
      }
      if (screen === "review" || screen === "hasil") base.frames = [0, 1, 2, 3].map(placeholderFrame)
      if (screen === "hasil") base.result = { slug: "contoh", createdAt: new Date().toISOString() }
      set(base)
    },
    devSetTier: (tier) => {
      set({ tier, paywall: { open: false, pendingTemplateId: null, paying: false } })
      notify(tier === "premium" ? "Sesi premium aktif" : "Sesi kembali gratis")
    },
    devSetConn: (conn) => {
      if (conn === "putus") {
        set({ conn, reconnectAttempt: 2, screen: "error", errorKind: "putus" })
        return
      }
      set({ conn, reconnectAttempt: 0 })
    },
    devSetError: (kind) => set({ screen: "error", errorKind: kind }),
    devSimulateJoin: () => {
      const s = get()
      if (s.partner?.joined) return
      set({ partner: { name: "Dimas", ready: false, joined: true } })
      notify("Dimas masuk")
    },
  }
})

// Sambungan video berubah (tersambung, lemot, putus) → pill & layar ikut.
// Kamera mati sendiri (izin dicabut, dipakai aplikasi lain) → minta izin lagi.
useMedia.subscribe((m, prev) => {
  const session = useSession.getState()
  if (prev.local && !m.local && session.camera === "granted" && session.screen !== "hasil") {
    useSession.setState({ camera: "unknown", autoCamera: false })
  }
  if (m.link !== prev.link || m.local !== prev.local) session.refresh()
})

// Sinkron ulang saat tab kembali terlihat (HP sempat terkunci, dsb.).
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") useSession.getState().resync()
  })
}
