import { create } from "zustand"
import { track } from "@/lib/analytics"
import { shareOrigin, SITE_HOST } from "@/lib/brand"
import type { ErrorKind } from "@/lib/content/errors"
import { randomPrompt } from "@/lib/content/prompts"
import { CameraError, cameraPermission } from "@/lib/rtc/media"
import { signalSchema } from "@/lib/rtc/peer"
import { api, RoomError } from "@/lib/session/api"
import { joinRoomChannel, type RoomChannel } from "@/lib/session/channel"
import { framePath, signFrames, uploadFrame, withRetry } from "@/lib/session/frames"
import { cardPathOf, loadBitmap, resultKey, resultPath, uploadResult } from "@/lib/session/results"
import { placeholderFrame } from "@/lib/session/demo"
import {
  deriveView,
  partnerEventMessage,
  shotPhase,
  type Camera,
  type RoomEvent,
  type RoomSnapshot,
  type ServerShot,
} from "@/lib/session/room-state"
import type { DevActions, Paywall, Screen, SessionActions, SessionState } from "@/lib/session/types"
import { measureOffset } from "@/lib/sync/clock"
import { getFilter } from "@/lib/templates/filters"
import { DEFAULT_TEMPLATE_ID, getTemplate } from "@/lib/templates/builtin"
import { PREMIUM_PRICE } from "@/lib/content/pricing"
import { formatLongDate, formatStripDate } from "@/lib/format"
import { saveImage } from "@/lib/save-file"
import { playShutter, playTick, unlockSounds } from "@/lib/sounds"
import { canvasToJpeg, FREE_WIDTH, PREMIUM_WIDTH, renderStrip } from "@/lib/templates/render"
import { renderShareCard } from "@/lib/templates/share-card"
import { notify, warn } from "@/lib/toast"
import { media, useMedia } from "@/stores/media"
import { usePwa } from "@/stores/pwa"

// Store sesi. Sumber kebenaran = server (RPC Supabase + broadcast realtime
// `room_state`); store menurunkan layar dari snapshot + keadaan lokal
// perangkat (izin kamera, sambungan video, layar undang). Kamera & WebRTC ada
// di stores/media.ts. Aksi dev* hanya untuk /dev/screens.

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const closedPaywall = (): Paywall => ({ open: false, pendingTemplateId: null, step: "tawar", charge: null, simulating: false })
const openedPaywall = (pendingTemplateId: string | null = null): Paywall => ({ ...closedPaywall(), open: true, pendingTemplateId })
const EMPTY_FRAMES = [null, null, null, null]
const PARTNER_GRACE_MS = 3000
// Capture boleh telat sedikit (timer tersendat); lewat 1 dtk, shot diulang
// berdua lewat resume_shot supaya tetap serentak.
const CAPTURE_LATE_MS = 250
const RESUME_AFTER_MS = 1000

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
  // Status mic tiap peserta dari presence channel.
  mics: Record<string, boolean>
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
    needsPremium: false,
    templateId: DEFAULT_TEMPLATE_ID,
    filterId: "none",
    sound: true,
    me: { name: "Kamu", ready: false },
    partner: null,
    shot: { idx: 0, phase: "idle", count: 3, prompt: "" },
    frames: [...EMPTY_FRAMES],
    framesReady: true,
    retakeQueue: [],
    selected: [],
    paywall: closedPaywall(),
    result: null,
    roomId: null,
    participantId: null,
    camera: "unknown",
    showInvite: false,
    partnerOnline: true,
    mics: {},
    autoCamera: false,
    snapshot: null,
  }
}

// ── Koneksi & jam (di luar React supaya bertahan saat pindah layar) ─────────
let unsubscribe: (() => void) | null = null
let clockOffset = 0
let ticker: ReturnType<typeof setInterval> | null = null
let partnerTimer: ReturnType<typeof setTimeout> | null = null
let connectingCode = ""
// Naik tiap masuk/keluar room; enterRoom lama yang masih jalan berhenti sendiri.
let generation = 0

// ── Foto yang diambil HP ini ────────────────────────────────────────────────
// Per `idx:v`. Dikirim bertahap (lapor → unggah → konfirmasi) dan dilanjutkan
// dari tahap terakhir kalau sempat gagal (sinyal hilang).
type Shot = {
  idx: number
  v: number
  blob: Blob
  url: string
  capturedAt: number
  stage: "report" | "upload" | "confirm" | "done"
  sending: boolean
}
const shots = new Map<string, Shot>()
const grabbing = new Set<string>()
// URL bertanda tangan untuk foto di Storage (path → URL).
let signed: Record<string, string> = {}
const signing = new Set<string>()
let captureTimer: ReturnType<typeof setTimeout> | null = null
let armedKey = ""
let resumedKey = ""
let healedKey = ""

function frameImages() {
  const local: Record<string, string> = {}
  for (const [key, shot] of shots) local[key] = shot.url
  return { local, remote: signed }
}

// ── Photostrip jadi ─────────────────────────────────────────────────────────
// Dirender di HP (canvas) dari foto asli, sekali per pengaturan. Host langsung
// mengunggah; tamu menyusul kalau 4 dtk belum ada (host keluar / sinyal jelek).
type Composite = { strip: Blob; card: Blob }
const composites = new Map<string, Promise<Composite>>()
const publishing = new Set<string>()
let publishTimer: ReturnType<typeof setTimeout> | null = null
let publishPath = ""
let publishJob: Promise<void> | null = null

function clearComposites() {
  if (publishTimer) clearTimeout(publishTimer)
  publishTimer = null
  publishPath = ""
  composites.clear()
  publishing.clear()
  publishJob = null
}

function clearShots() {
  if (captureTimer) clearTimeout(captureTimer)
  captureTimer = null
  armedKey = ""
  resumedKey = ""
  healedKey = ""
  for (const shot of shots.values()) URL.revokeObjectURL(shot.url)
  shots.clear()
  grabbing.clear()
  signed = {}
  signing.clear()
}

function copyText(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {})
}

function errorKindOf(e: unknown): ErrorKind {
  return e instanceof RoomError && e.kind ? e.kind : "jaringan"
}

type Internal = { resync: () => Promise<void>; refresh: () => void; settle: () => Promise<void> }
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
      images: frameImages(),
    })
    const leavingReview = s.screen === "review" && view.screen !== "review"
    const upgraded = s.tier !== "premium" && view.tier === "premium"
    set({
      code: view.code,
      role: view.role,
      screen: view.screen,
      errorKind: view.errorKind ?? s.errorKind,
      tier: view.tier,
      needsPremium: view.needsPremium,
      templateId: view.templateId,
      filterId: view.filterId as SessionState["filterId"],
      me: view.me,
      partner: view.partner,
      frames: view.frames,
      framesReady: view.framesReady,
      retakeQueue: view.retakeQueue,
      result: view.result,
      conn: view.conn,
      reconnectAttempt: view.reconnectAttempt,
      selected: leavingReview ? [] : s.selected,
    })
    // Sesi selesai: kamera & sambungan video tidak dibutuhkan lagi.
    if (view.screen === "hasil" && useMedia.getState().local) media.stop()
    if (view.screen === "hasil") {
      publishComposite()
      track(s.roomId, "result_viewed", undefined, { once: true })
    }
    if (event?.by && event.by !== s.participantId) {
      const msg = partnerEventMessage(event, view.partner?.name ?? "Dia", (id) => getTemplate(id).name)
      if (msg) notify(msg)
    }
    // Lunas (webhook → broadcast, atau snapshot hasil resync): paywall tutup
    // di dua HP; yang bayar dapat konfirmasi, pasangannya pesan dari atas.
    if (upgraded) {
      const mine = event ? event.type === "upgraded" && event.by === s.participantId : s.paywall.open
      if (s.paywall.open) set({ paywall: closedPaywall() })
      if (mine) notify("Pembayaran berhasil, sesi jadi premium")
    }
    if (event?.type === "payment_failed" && s.paywall.open && event.order === s.paywall.charge?.orderId) {
      set({ paywall: { ...get().paywall, step: "gagal", simulating: false } })
    }
    syncTicker()
  }

  const applySnapshot = (snap: RoomSnapshot, event: RoomEvent | null) => {
    pruneShots(snap)
    set({ snapshot: snap })
    recompute(event)
    void signMissing(snap)
    healOrphans(snap)
  }

  // Foto sendiri yang tercatat tapi filenya tidak pernah sampai (tab/HP sempat
  // tertutup sebelum upload selesai): tidak bisa dipulihkan dan bikin review
  // tertahan "Nunggu foto terkirim", jadi diulang berdua.
  const healOrphans = (snap: RoomSnapshot) => {
    const me = get().participantId
    if (snap.status !== "review" || !me) return
    const lost = snap.frames
      .filter((f) => f.participant_id === me && f.status !== "uploaded" && !shots.has(`${f.idx}:${f.v}`))
      .sort((a, b) => a.idx - b.idx)
    if (!lost.length) return
    const key = `${snap.id}:${lost.map((f) => `${f.idx}:${f.v}`).join(",")}`
    if (healedKey === key) return
    healedKey = key
    const indices = lost.map((f) => f.idx)
    notify(indices.length > 1 ? "Beberapa foto belum sempat terkirim, diulang ya" : `Foto ${indices[0] + 1} belum sempat terkirim, diulang ya`)
    api.requestRetake(snap.id, indices).catch(() => {
      healedKey = ""
    })
  }

  // Foto yang sudah terkirim tapi barisnya dihapus server (diulang) dibuang,
  // supaya isi HP ini selalu sama dengan server.
  const pruneShots = (snap: RoomSnapshot) => {
    const me = get().participantId
    for (const [key, shot] of shots) {
      if (shot.stage !== "done") continue
      const kept = snap.frames.some((f) => f.idx === shot.idx && f.v === shot.v && f.participant_id === me)
      if (kept) continue
      URL.revokeObjectURL(shot.url)
      shots.delete(key)
    }
  }

  const resync = async () => {
    const roomId = get().roomId
    if (!roomId) return
    retryDeliveries()
    try {
      applySnapshot(await api.getRoom(roomId), null)
    } catch {}
  }

  // Foto pasangan (dan foto sendiri setelah muat ulang) lewat URL bertanda tangan.
  const signMissing = async (snap: RoomSnapshot) => {
    const me = get().participantId
    const need = snap.frames
      .filter((f) => f.path && !signed[f.path] && !signing.has(f.path))
      .filter((f) => !(f.participant_id === me && shots.has(`${f.idx}:${f.v}`)))
      .map((f) => f.path as string)
    if (!need.length) return
    need.forEach((path) => signing.add(path))
    try {
      signed = { ...signed, ...(await signFrames(need)) }
      recompute()
    } catch {
      // Dicoba lagi di snapshot / sinkron ulang berikutnya.
    } finally {
      need.forEach((path) => signing.delete(path))
    }
  }

  // Lapor "sudah motret" dulu supaya sesi lanjut tanpa menunggu upload.
  const deliver = async (roomId: string, participantId: string, shot: Shot) => {
    if (shot.sending || shot.stage === "done") return
    shot.sending = true
    const path = framePath(roomId, participantId, shot.idx, shot.v)
    try {
      if (shot.stage === "report") {
        await withRetry(() => api.frameCaptured(roomId, shot.idx, shot.v, shot.capturedAt))
        shot.stage = "upload"
      }
      if (shot.stage === "upload") {
        await withRetry(() => uploadFrame(path, shot.blob))
        shot.stage = "confirm"
      }
      if (shot.stage === "confirm") {
        await withRetry(() => api.frameUploaded(roomId, shot.idx, shot.v, path))
        shot.stage = "done"
      }
    } catch {
      warn("Foto belum terkirim, nanti dicoba lagi")
    } finally {
      shot.sending = false
    }
  }

  const retryDeliveries = () => {
    const { roomId, participantId } = get()
    if (!roomId || !participantId) return
    for (const shot of shots.values()) void deliver(roomId, participantId, shot)
  }

  const renderKeyOf = (s: SessionState) => resultKey(s.templateId, s.filterId, s.tier === "premium")

  // Photostrip + kartu pratinjau link dari 8 foto asli (sekali per pengaturan).
  const buildComposite = (key: string): Promise<Composite> => {
    const s = get()
    const snap = s.snapshot
    const result = s.result
    const me = s.participantId
    if (!snap || !result || !me) return Promise.reject(new Error("no_result"))
    const cacheKey = `${result.slug}:${key}`
    const cached = composites.get(cacheKey)
    if (cached) return cached

    const job = (async () => {
      const host = snap.participants.find((p) => p.role === "host")
      const guest = snap.participants.find((p) => p.role === "guest")
      type Row = RoomSnapshot["frames"][number]
      const rowOf = (idx: number, id?: string) => snap.frames.find((f) => f.idx === idx && f.participant_id === id)
      const rows = [0, 1, 2, 3].map((idx) => [rowOf(idx, host?.id), rowOf(idx, guest?.id)] as const)
      const localUrl = (row: Row) => (row.participant_id === me ? shots.get(`${row.idx}:${row.v}`)?.url : undefined)
      // URL bertanda tangan baru: yang lama bisa sudah kedaluwarsa (1 jam).
      const toSign = rows.flat().flatMap((row) => (row?.path && !localUrl(row) ? [row.path] : []))
      const fresh = toSign.length ? await signFrames(toSign) : {}
      const urlOf = (row: Row | undefined) => {
        const url = row && (localUrl(row) ?? (row.path ? fresh[row.path] : undefined))
        if (!url) throw new Error("frame_missing")
        return url
      }
      const images = await Promise.all(
        rows.map(async ([a, b]) => ({ a: await loadBitmap(urlOf(a)), b: await loadBitmap(urlOf(b)) }))
      )
      try {
        const premium = s.tier === "premium"
        const createdAt = new Date(result.createdAt)
        const canvas = await renderStrip({
          template: getTemplate(s.templateId),
          images,
          filterCss: getFilter(s.filterId).css,
          tokens: { date: formatStripDate(createdAt), host: SITE_HOST, names: result.names },
          watermark: !premium,
          width: premium ? PREMIUM_WIDTH : FREE_WIDTH,
        })
        const strip = await canvasToJpeg(canvas, 0.92)
        const cardCanvas = await renderShareCard({
          strip: canvas,
          title: result.names ?? "Photostrip kami",
          subtitle: `Foto bareng · ${formatLongDate(createdAt)}`,
          cta: `Bikin punyamu di ${SITE_HOST}`,
        })
        return { strip, card: await canvasToJpeg(cardCanvas, 0.85) }
      } finally {
        images.forEach(({ a, b }) => {
          a.close()
          b.close()
        })
      }
    })()
    composites.set(cacheKey, job)
    job.catch(() => composites.delete(cacheKey))
    return job
  }

  // Render → unggah kartu & photostrip → catat di server. Satu jalan per path.
  const runPublish = (path: string, key: string, slug: string): Promise<void> => {
    if (publishing.has(path) && publishJob) return publishJob
    publishing.add(path)
    const job = (async () => {
      let failed = false
      try {
        const { strip, card } = await buildComposite(key)
        await withRetry(() => uploadResult(cardPathOf(path), card))
        await withRetry(() => uploadResult(path, strip))
        await withRetry(() => api.setResultImage(slug, path), 2)
      } catch {
        failed = true // pengaturan berubah (render lama) atau jaringan
      } finally {
        publishing.delete(path)
      }
      if (failed) setTimeout(publishComposite, 5000)
    })()
    publishJob = job
    return job
  }

  // Pastikan file di server = pengaturan hasil saat ini (template, gratis/premium).
  const publishComposite = () => {
    const s = get()
    const result = s.result
    const roomId = s.roomId
    if (s.screen !== "hasil" || !result || !roomId) return
    const key = renderKeyOf(s)
    const path = resultPath(roomId, result.slug, key)
    void buildComposite(key).catch(() => {}) // siap untuk Unduh
    if (result.imagePath === path || publishing.has(path) || publishPath === path) return
    if (publishTimer) clearTimeout(publishTimer)
    publishPath = path
    publishTimer = setTimeout(
      () => {
        publishTimer = null
        publishPath = ""
        const cur = get()
        if (!cur.result || cur.result.imagePath === path) return
        if (cur.result.slug !== result.slug || renderKeyOf(cur) !== key) return
        void runPublish(path, key, result.slug)
      },
      s.role === "host" ? 0 : 4000
    )
  }

  // Ambil foto dari kamera lokal tepat di capture_at (jadwal server).
  const captureShot = async (shot: ServerShot) => {
    const s = get()
    const snap = s.snapshot
    const current = snap?.current_shot
    const key = `${shot.idx}:${shot.v}`
    if (!snap || !s.participantId || snap.status !== "capturing") return
    if (current?.idx !== shot.idx || current.v !== shot.v || shots.has(key) || grabbing.has(key)) return
    grabbing.add(key)
    const capturedAt = Date.now() + clockOffset
    if (s.sound) playShutter()
    try {
      const blob = await media.grab()
      // Foto lama untuk urutan yang sama (sebelum diulang) diganti.
      for (const [k, old] of shots) {
        if (old.idx !== shot.idx) continue
        URL.revokeObjectURL(old.url)
        shots.delete(k)
      }
      const url = URL.createObjectURL(blob)
      const entry: Shot = { idx: shot.idx, v: shot.v, blob, url, capturedAt, stage: "report", sending: false }
      shots.set(key, entry)
      recompute()
      void deliver(snap.id, s.participantId, entry)
    } catch {
      // Kamera belum siap: shot ini nanti diulang berdua (resume_shot).
    } finally {
      grabbing.delete(key)
    }
  }

  const onPresence = (ids: string[], mics: Record<string, boolean>) => {
    set({ mics })
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

  // Detak 50 ms selama sesi foto: fase UI & suara dari jadwal server. Capture
  // sendiri memakai timer presisi tepat di capture_at.
  const tick = () => {
    const s = get()
    const snap = s.snapshot
    const shot = snap?.current_shot
    if (!snap || !shot || snap.status !== "capturing" || !s.participantId) return
    const now = Date.now() + clockOffset
    const { phase, count } = shotPhase(shot, now, snap.frames.length > 0)
    if (s.sound && phase === "count" && (s.shot.phase !== "count" || s.shot.count !== count)) playTick()
    if (phase !== s.shot.phase || count !== s.shot.count || shot.idx !== s.shot.idx || shot.prompt !== s.shot.prompt) {
      set({ shot: { idx: shot.idx, phase, count, prompt: shot.prompt } })
    }

    // Kamera belum nyala (layar izin): tunggu, shot yang terlewat diulang nanti.
    if (!useMedia.getState().local) return
    const key = `${shot.idx}:${shot.v}`
    const taken =
      shots.has(key) ||
      grabbing.has(key) ||
      snap.frames.some((f) => f.idx === shot.idx && f.v === shot.v && f.participant_id === s.participantId)
    if (taken) return
    const until = shot.capture_at - now
    if (until > 0) {
      const armed = `${key}:${shot.capture_at}`
      if (armedKey !== armed) {
        armedKey = armed
        if (captureTimer) clearTimeout(captureTimer)
        captureTimer = setTimeout(() => void captureShot(shot), until)
      }
    } else if (-until <= CAPTURE_LATE_MS) {
      void captureShot(shot)
    } else if (-until > RESUME_AFTER_MS && resumedKey !== key) {
      // HP ini melewatkan shot (putus / tab di belakang): ulang berdua.
      resumedKey = key
      api.resumeShot(snap.id, shot.v).catch(() => {
        resumedKey = ""
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
    clearShots()
    clearComposites()
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
    // Tunggu photostrip selesai terunggah sebelum meninggalkan layar hasil
    // (maks. 8 dtk), supaya link yang dibagikan tidak kosong.
    settle: async () => {
      const s = get()
      if (s.screen !== "hasil" || !s.result || !s.roomId) return
      const key = renderKeyOf(s)
      const path = resultPath(s.roomId, s.result.slug, key)
      if (s.result.imagePath === path) return
      if (publishTimer) clearTimeout(publishTimer)
      publishTimer = null
      publishPath = ""
      await Promise.race([runPublish(path, key, s.result.slug), new Promise((r) => setTimeout(r, 8000))])
    },

    createRoom: async (opts) => {
      const { code } = await api.createRoom(!!opts?.premium)
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
        // Status mic ikut presence, supaya layar dia tahu mic kamu nyala.
        const joinedRoom = room
        joinedRoom.setMic(useMedia.getState().mic)
        const stopMicSync = useMedia.subscribe((m, prev) => {
          if (m.mic !== prev.mic) joinedRoom.setMic(m.mic)
        })
        unsubscribe = () => {
          stopMicSync()
          joinedRoom.leave()
        }
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
      unlockSounds()
      if (!get().roomId) {
        set({ screen: "lobby" }) // galeri dev: tanpa kamera sungguhan
        return
      }
      try {
        await media.openCamera()
        set({ camera: "granted" })
        track(get().roomId, "camera_granted", undefined, { once: true })
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
        track(get().roomId, "camera_denied", { reason }, { once: true })
        recompute()
      }
    },
    denyCamera: () => {
      set({ camera: "denied" })
      track(get().roomId, "camera_denied", { reason: "ditolak" }, { once: true })
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
        set({ paywall: openedPaywall(t.id) })
        track(s.roomId, "paywall_viewed", { from: s.screen, template: t.id })
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
      unlockSounds() // dari klik: izin audio iOS untuk suara hitung mundur
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
      unlockSounds()
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
      track(get().roomId, "retake", { count: queue.length })
      if (get().roomId) guard(() => api.requestRetake(room(), queue))
    },
    retakeAll: () => {
      notify("Ulang semua foto")
      track(get().roomId, "retake", { count: 4 })
      if (get().roomId) guard(() => api.requestRetake(room(), [0, 1, 2, 3]))
    },

    // M5: komposit canvas + unggah hasil.
    makeStrip: () => {
      if (!get().framesReady) {
        notify("Tunggu sebentar, foto masih dikirim")
        return
      }
      // Tanpa toast: judul layar hasil sudah bilang "Jadi!", dan toast di HP
      // menutupi tombol unduh tepat saat mau diketuk.
      if (get().roomId) guard(() => api.finishSession(room()))
    },
    // iPhone: lembar bagikan (Simpan Gambar ke Foto). Lainnya: unduh file.
    download: async () => {
      const s = get()
      const saved = s.tier === "premium" ? "Photostrip tersimpan, kualitas tinggi" : "Photostrip tersimpan"
      if (!s.roomId || !s.result) {
        notify(saved)
        return
      }
      try {
        const { strip } = await buildComposite(renderKeyOf(s))
        await saveImage(strip, `bareng-${s.result.slug}.jpg`, { ios: usePwa.getState().ios, title: "Photostrip kami" })
        track(s.roomId, "download", { tier: s.tier })
        notify(saved)
      } catch (e) {
        if ((e as DOMException)?.name === "AbortError") return
        warn("Belum bisa menyimpan, coba lagi")
      }
    },
    share: () => {
      const slug = get().result?.slug
      if (!slug) return
      const url = resultUrl(slug)
      if (navigator.share) {
        navigator
          .share({ title: "Photostrip kami", url })
          .then(() => track(get().roomId, "share", { method: "native" }))
          .catch(() => {})
        return
      }
      copyText(url)
      track(get().roomId, "share", { method: "copy" })
      notify("Link hasil disalin")
    },
    copyResultLink: () => {
      const slug = get().result?.slug
      if (!slug) return
      copyText(resultUrl(slug))
      track(get().roomId, "share", { method: "copy" })
      notify("Link hasil disalin")
    },
    deleteResult: async () => {
      const slug = get().result?.slug
      if (slug && get().roomId) {
        await api.deleteResult(slug)
        // File di Storage dibuang sekarang juga (jadwal tiap jam sebagai cadangan).
        void api.purgeResult(slug).catch(() => {})
      }
      notify("Foto dihapus")
    },

    openPaywall: () => {
      set({ paywall: openedPaywall() })
      track(get().roomId, "paywall_viewed", { from: get().screen })
    },
    closePaywall: () => {
      if (get().paywall.step === "memuat") return
      set({ paywall: closedPaywall() })
    },
    // Buka tagihan QRIS (route server → provider). Lunas hanya lewat webhook;
    // hasilnya datang sebagai broadcast `upgraded` ke dua HP.
    pay: async () => {
      const s = get()
      if (s.paywall.step === "memuat") return
      set({ paywall: { ...s.paywall, step: "memuat", charge: null, simulating: false } })
      try {
        const charge = s.roomId
          ? await api.startPayment(room(), s.paywall.pendingTemplateId)
          : // /dev/screens: tanpa room, tagihan contoh.
            { orderId: "BRG-CONTOHCONTOH", amount: PREMIUM_PRICE, qr: "BARENG-UJI|contoh", expiresAt: Date.now() + 15 * 60_000, test: true }
        if (!get().paywall.open) return
        set({ paywall: { ...get().paywall, step: "qris", charge } })
      } catch (e) {
        if (e instanceof RoomError && e.code === "already_premium") {
          set({ paywall: closedPaywall() })
          void resync()
          return
        }
        set({ paywall: { ...get().paywall, step: "tawar" } })
        warn("Belum bisa membuat QR pembayaran, coba lagi")
      }
    },
    // Mode uji: tiru notifikasi gateway (lunas/gagal) lewat webhook yang sama.
    simulatePayment: async (outcome) => {
      const s = get()
      const charge = s.paywall.charge
      if (!charge || s.paywall.simulating) return
      set({ paywall: { ...s.paywall, simulating: true } })
      if (!s.roomId) {
        if (outcome === "failed") return set({ paywall: { ...get().paywall, step: "gagal", simulating: false } })
        set({ tier: "premium", templateId: s.paywall.pendingTemplateId ?? s.templateId, paywall: closedPaywall() })
        notify("Pembayaran berhasil, sesi jadi premium")
        return
      }
      try {
        const res = await api.simulatePayment(charge.orderId, outcome)
        if (res.status === "failed" && get().paywall.charge?.orderId === charge.orderId) {
          set({ paywall: { ...get().paywall, step: "gagal", simulating: false } })
        }
        // Cadangan kalau broadcast telat: ambil state terbaru dari server.
        if (res.status === "paid") await resync()
      } catch {
        set({ paywall: { ...get().paywall, simulating: false } })
        warn("Simulasi pembayaran gagal dikirim")
      }
    },

    toggleSound: () => {
      unlockSounds()
      const sound = !get().sound
      set({ sound })
      // Contoh bunyinya langsung, supaya jelas ini suara apa (bukan mic).
      if (sound) playShutter()
      notify(sound ? "Suara hitung mundur & shutter nyala" : "Suara hitung mundur & shutter mati")
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
        paywall: closedPaywall(),
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
      if (screen === "hasil") {
        base.result = { slug: "contoh", createdAt: new Date().toISOString(), imagePath: null, names: null, expiresAt: null }
      }
      set(base)
    },
    devSetTier: (tier) => {
      set({ tier, paywall: closedPaywall() })
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

// Lama menyambung video (catatan teknis): dari mulai menyambung sampai
// tersambung pertama kali. Lewat TURN (relay) baru ketahuan dari sampel
// stats pertama, jadi dicatat sesaat setelah tersambung.
let linkStartedAt = 0
function trackLink(roomId: string | null, status: string, prevStatus: string, attempt: number) {
  if (!roomId || status === prevStatus) return
  if (status === "connecting" && prevStatus === "idle") linkStartedAt = performance.now()
  if (status === "connected" && linkStartedAt) {
    const ms = Math.round(performance.now() - linkStartedAt)
    linkStartedAt = 0
    setTimeout(() => track(roomId, "rtc_connected", { ms, relay: useMedia.getState().link.relay }, { once: true }), 3000)
  }
  if (status === "failed") track(roomId, "rtc_failed", { attempt }, { once: true })
}

// Sambungan video berubah (tersambung, lemot, putus) → pill & layar ikut.
// Kamera mati sendiri (izin dicabut, dipakai aplikasi lain) → minta izin lagi.
useMedia.subscribe((m, prev) => {
  const session = useSession.getState()
  trackLink(session.roomId, m.link.status, prev.link.status, prev.link.attempt)
  // `resting` = kamera sengaja dilepas di layar review, bukan dicabut orangnya.
  if (prev.local && !m.local && !m.resting && session.camera === "granted" && session.screen !== "hasil") {
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

// Sinyal kembali setelah putus: kirim ulang foto yang tertunda.
if (typeof window !== "undefined") {
  window.addEventListener("online", () => useSession.getState().resync())
}
