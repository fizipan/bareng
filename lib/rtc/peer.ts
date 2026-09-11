"use client"

import { z } from "zod"
import { getIceServers } from "./ice"
import { assessQuality, readStats, type LinkQuality, type StatsSample } from "./quality"

// Satu sambungan video P2P ke pasangan dengan pola "perfect negotiation"
// (MDN): tamu = pihak "polite" yang mengalah saat dua offer bertabrakan.
// Sinyal lewat channel realtime room. Tiap instance halaman punya `sid`;
// begitu pasangan muncul dengan sid baru (muat ulang / sambung ulang manual),
// sambungan lama dibuang dan negosiasi diulang dari nol.

export const signalSchema = z.object({
  from: z.string(),
  sid: z.string(),
  to: z.string().optional(),
  kind: z.enum(["hello", "sdp", "ice", "bye"]),
  ack: z.boolean().optional(),
  description: z
    .object({ type: z.enum(["offer", "answer", "pranswer", "rollback"]), sdp: z.string().optional() })
    .optional(),
  candidate: z
    .object({
      candidate: z.string().optional(),
      sdpMid: z.string().nullable().optional(),
      sdpMLineIndex: z.number().nullable().optional(),
      usernameFragment: z.string().nullable().optional(),
    })
    .optional(),
})

export type Signal = z.infer<typeof signalSchema>

export type LinkStatus = "idle" | "connecting" | "connected" | "reconnecting" | "failed"

export type LinkState = {
  status: LinkStatus
  attempt: number
  quality: LinkQuality
  remote: MediaStream | null
  relay: boolean
}

export const IDLE_LINK: LinkState = { status: "idle", attempt: 0, quality: "ok", remote: null, relay: false }

const MAX_RESTARTS = 3
const CONNECT_TIMEOUT_MS = 12_000
// Negosiasi selesai tapi ICE tak kunjung jalan (mis. kandidat tidak pernah
// dikumpulkan setelah rollback di Chrome): restart ICE dari host.
const STUCK_MS = 6_000
// Tamu menunggu offer pertama host sebelum memasang kamera, supaya dua offer
// tidak bertabrakan; kalau host belum juga mengirim, tamu mulai sendiri.
const OFFER_WAIT_MS = 2_500
const RESTART_TIMEOUT_MS = 8_000
const DISCONNECT_GRACE_MS = 3_000
const STATS_MS = 2_000
// Preview ke pasangan ±480p @24fps; kamera tetap resolusi penuh untuk capture.
const PREVIEW = { maxBitrate: 700_000, maxFramerate: 24, shortSide: 480 }

type Options = {
  selfId: string
  polite: boolean
  send: (signal: Signal) => void
  onChange: (state: LinkState) => void
}

export class PeerLink {
  state: LinkState = IDLE_LINK
  private pc: RTCPeerConnection | null = null
  private neg = { makingOffer: false, ignoreOffer: false }
  private sid = crypto.randomUUID()
  private remoteSid: string | null = null
  private local: MediaStream | null = null
  private queue: Promise<void> = Promise.resolve()
  private timer: ReturnType<typeof setTimeout> | undefined
  private statsTimer: ReturnType<typeof setInterval> | undefined
  private prevStats: StatsSample | null = null
  private badStreak = 0
  private closed = false
  private everConnected = false
  private waitingOffer = false
  private offerTimer: ReturnType<typeof setTimeout> | undefined

  constructor(private opts: Options) {}

  // Umumkan diri ke siapa pun di room; dipanggil tiap channel (re)subscribe.
  announce() {
    this.emit({ kind: "hello", ack: false, to: undefined })
  }

  handle(signal: Signal) {
    this.queue = this.queue.then(() => this.process(signal)).catch(() => {})
  }

  setLocal(stream: MediaStream | null) {
    this.local = stream
    if (stream && this.pc && !this.waitingOffer) this.attach(this.pc, stream)
  }

  // Track baru di stream lokal (mis. mic dinyalakan) → negosiasi ulang.
  syncLocal() {
    if (this.local && this.pc) this.attach(this.pc, this.local)
  }

  // Sambung ulang manual: sid baru, jadi pasangan ikut membuat sambungan baru.
  reconnect() {
    if (this.closed) return
    this.sid = crypto.randomUUID()
    this.remoteSid = null
    this.teardown()
    this.set({ ...IDLE_LINK, status: "connecting" })
    this.announce()
  }

  close() {
    if (this.closed) return
    this.emit({ kind: "bye" })
    this.closed = true
    this.teardown()
  }

  private async process(sig: Signal) {
    if (this.closed || sig.from === this.opts.selfId) return
    if (sig.to && sig.to !== this.sid) return // untuk instance kita yang lama

    if (sig.kind === "bye") {
      if (sig.sid === this.remoteSid) {
        this.remoteSid = null
        this.teardown()
        this.set(IDLE_LINK)
      }
      return
    }

    if (sig.kind === "hello") {
      if (sig.sid !== this.remoteSid) {
        this.remoteSid = sig.sid
        await this.open()
      } else if (this.state.status === "failed") {
        // Pasangan yang sama muncul lagi setelah kita menyerah: coba lagi.
        this.state = { ...this.state, attempt: 0 }
        this.restart()
      }
      if (!sig.ack) this.emit({ kind: "hello", ack: true })
      return
    }

    if (sig.sid !== this.remoteSid) {
      // Offer dari instance pasangan yang belum dikenal = sesi baru.
      if (sig.kind !== "sdp" || sig.description?.type !== "offer") return
      this.remoteSid = sig.sid
      await this.open()
    }
    const pc = this.pc
    if (!pc) return
    const neg = this.neg

    if (sig.kind === "sdp" && sig.description) {
      const offer = sig.description.type === "offer"
      const collision = offer && (neg.makingOffer || pc.signalingState !== "stable")
      neg.ignoreOffer = !this.opts.polite && collision
      if (neg.ignoreOffer) return
      await pc.setRemoteDescription(sig.description as RTCSessionDescriptionInit)
      if (offer) {
        await pc.setLocalDescription()
        if (pc.localDescription) this.emit({ kind: "sdp", description: pc.localDescription.toJSON() })
        // Offer pertama host sudah dijawab: sekarang tamu pasang kameranya.
        if (this.waitingOffer) this.releaseLocal(pc)
      }
      return
    }

    if (sig.kind === "ice" && sig.candidate) {
      // Kandidat untuk offer yang kita abaikan boleh gagal.
      await pc.addIceCandidate(sig.candidate as RTCIceCandidateInit).catch(() => {})
    }
  }

  private async open() {
    this.teardown()
    const iceServers = await getIceServers()
    if (this.closed) return
    const pc = new RTCPeerConnection({ iceServers })
    const neg = { makingOffer: false, ignoreOffer: false }
    this.pc = pc
    this.neg = neg
    this.everConnected = false
    this.set({ ...IDLE_LINK, status: "connecting" })

    pc.ontrack = ({ track, streams }) => {
      if (this.pc !== pc) return
      const remote = streams[0] ?? this.state.remote ?? new MediaStream()
      if (!remote.getTracks().includes(track)) remote.addTrack(track)
      this.set({ remote })
    }
    pc.onicecandidate = ({ candidate }) => {
      if (candidate && this.pc === pc) this.emit({ kind: "ice", candidate: candidate.toJSON() })
    }
    pc.onnegotiationneeded = async () => {
      try {
        neg.makingOffer = true
        await pc.setLocalDescription()
        if (this.pc === pc && pc.localDescription) this.emit({ kind: "sdp", description: pc.localDescription.toJSON() })
      } catch {
        // Dicoba lagi di negosiasi berikutnya.
      } finally {
        neg.makingOffer = false
      }
    }
    pc.oniceconnectionstatechange = () => this.onIceState(pc)
    pc.onsignalingstatechange = () => {
      if (pc.signalingState !== "stable" || this.pc !== pc) return
      void this.tuneSender(pc)
      const ice = pc.iceConnectionState
      if (pc.remoteDescription && (ice === "new" || ice === "checking") && this.state.status !== "failed") this.arm(STUCK_MS)
    }
    if (this.opts.polite) {
      this.waitingOffer = true
      clearTimeout(this.offerTimer)
      this.offerTimer = setTimeout(() => this.releaseLocal(pc), OFFER_WAIT_MS)
    } else if (this.local) {
      this.attach(pc, this.local)
    }
  }

  private releaseLocal(pc: RTCPeerConnection) {
    clearTimeout(this.offerTimer)
    this.waitingOffer = false
    if (this.pc === pc && this.local) this.attach(pc, this.local)
  }

  // Pasang track lokal. Kalau jalur untuk jenis itu sudah ada (mis. kamera
  // dibuka ulang setelah layar review), track-nya diganti di tempat supaya
  // tidak menambah jalur baru dan pasangan tidak melihat video beku.
  private attach(pc: RTCPeerConnection, stream: MediaStream) {
    for (const track of stream.getTracks()) {
      if (pc.getSenders().some((s) => s.track === track)) continue
      const slot = pc.getTransceivers().find((t) => {
        const kind = t.sender.track?.kind ?? t.receiver.track?.kind
        return kind === track.kind && t.sender.track !== track && t.direction !== "recvonly"
      })
      if (slot) void slot.sender.replaceTrack(track).catch(() => {})
      else pc.addTrack(track, stream)
    }
  }

  // Berhenti mengirim video/suara tanpa menutup sambungan (layar review).
  detachLocal() {
    this.local = null
    this.pc?.getSenders().forEach((s) => void s.replaceTrack(null).catch(() => {}))
  }

  private onIceState(pc: RTCPeerConnection) {
    if (this.pc !== pc) return
    switch (pc.iceConnectionState) {
      case "checking":
        if (this.state.status === "connecting") this.arm(CONNECT_TIMEOUT_MS)
        break
      case "connected":
      case "completed":
        clearTimeout(this.timer)
        this.everConnected = true
        this.set({ status: "connected", attempt: 0 })
        void this.tuneSender(pc)
        this.startStats(pc)
        break
      case "disconnected":
        this.arm(DISCONNECT_GRACE_MS)
        break
      case "failed":
        this.restart()
        break
    }
  }

  // Kalau dalam `ms` ICE belum tersambung, restart ICE.
  private arm(ms: number) {
    clearTimeout(this.timer)
    const pc = this.pc
    this.timer = setTimeout(() => {
      if (this.pc !== pc || !pc) return
      const s = pc.iceConnectionState
      if (s !== "connected" && s !== "completed") this.restart()
    }, ms)
  }

  // Maks 3× (PRD R2), lalu menyerah → UI menampilkan panduan sambung ulang.
  private restart() {
    const pc = this.pc
    if (!pc || this.closed) return
    clearTimeout(this.timer)
    if (this.state.attempt >= MAX_RESTARTS) {
      this.stopStats()
      this.set({ status: "failed" })
      return
    }
    // Belum pernah tersambung: tetap "menyambung" (bukan "terputus") di UI.
    this.set({ status: this.everConnected ? "reconnecting" : "connecting", attempt: this.state.attempt + 1 })
    // Hanya host (impolite) yang memulai restart, supaya offer tidak bertabrakan;
    // tamu cukup menunggu offer baru dari host.
    if (!this.opts.polite) pc.restartIce()
    this.arm(RESTART_TIMEOUT_MS)
  }

  private async tuneSender(pc: RTCPeerConnection) {
    for (const sender of pc.getSenders()) {
      const track = sender.track
      if (track?.kind !== "video") continue
      const params = sender.getParameters()
      if (!params.encodings?.length) continue
      const { width = 640, height = 480 } = track.getSettings()
      const encoding = params.encodings[0]
      encoding.maxBitrate = PREVIEW.maxBitrate
      encoding.maxFramerate = PREVIEW.maxFramerate
      encoding.scaleResolutionDownBy = Math.max(1, Math.min(width, height) / PREVIEW.shortSide)
      await sender.setParameters(params).catch(() => {})
    }
  }

  private startStats(pc: RTCPeerConnection) {
    if (this.statsTimer) return
    this.prevStats = null
    this.badStreak = 0
    this.statsTimer = setInterval(async () => {
      if (this.pc !== pc) return
      const sample = readStats(await pc.getStats())
      const bad = assessQuality(this.prevStats, sample) === "lambat"
      this.prevStats = sample
      this.badStreak = bad ? this.badStreak + 1 : 0
      const quality: LinkQuality = this.badStreak >= 2 ? "lambat" : "ok"
      if (quality !== this.state.quality || sample.relay !== this.state.relay) this.set({ quality, relay: sample.relay })
    }, STATS_MS)
  }

  private stopStats() {
    clearInterval(this.statsTimer)
    this.statsTimer = undefined
  }

  private teardown() {
    clearTimeout(this.timer)
    clearTimeout(this.offerTimer)
    this.waitingOffer = false
    this.stopStats()
    const pc = this.pc
    this.pc = null
    if (!pc) return
    pc.ontrack = null
    pc.onicecandidate = null
    pc.onnegotiationneeded = null
    pc.oniceconnectionstatechange = null
    pc.onsignalingstatechange = null
    pc.close()
  }

  private emit(partial: Pick<Signal, "kind"> & Partial<Signal>) {
    if (this.closed) return
    this.opts.send({ from: this.opts.selfId, sid: this.sid, to: this.remoteSid ?? undefined, ...partial })
  }

  private set(partial: Partial<LinkState>) {
    if (this.closed) return
    this.state = { ...this.state, ...partial }
    this.opts.onChange(this.state)
  }
}
