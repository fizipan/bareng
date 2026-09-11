"use client"

import { create } from "zustand"
import { grabFrame, releaseCapture, warmCapture } from "@/lib/rtc/capture"
import { CameraError, isIOS, openCamera, openCameraAndMic, openMic, stopStream, type CameraFailure } from "@/lib/rtc/media"
import { IDLE_LINK, PeerLink, type LinkState, type Signal } from "@/lib/rtc/peer"

// Kamera lokal + sambungan video ke pasangan. Hidup di luar React supaya
// tidak putus saat pindah layar (izin → lobby → capture → review).

type MediaState = {
  local: MediaStream | null
  remote: MediaStream | null
  link: LinkState
  opening: boolean
  mic: boolean
  micBusy: boolean
  // Kamera & mic dilepas sementara (layar review): lampu kamera di HP mati,
  // dibuka lagi saat kembali ke lobby / foto ulang.
  resting: boolean
}

export const useMedia = create<MediaState>()(() => ({
  local: null,
  remote: null,
  link: IDLE_LINK,
  opening: false,
  mic: false,
  micBusy: false,
  resting: false,
}))

let peer: PeerLink | null = null
let micBeforeRest = false
let opening: Promise<MediaStream> | null = null
// Naik tiap stop(): kamera yang baru selesai dibuka setelah stop langsung dimatikan.
let cameraGen = 0

// Pakai stream ini sebagai kamera lokal: pasang pendengar "ended", kirim ke
// pasangan, dan siapkan kanvas untuk memotret.
function adopt(stream: MediaStream) {
  stream.getVideoTracks()[0]?.addEventListener("ended", () => {
    if (useMedia.getState().local === stream) useMedia.setState({ local: null, mic: false })
  })
  const audio = stream.getAudioTracks()[0]
  audio?.addEventListener("ended", () => {
    stream.removeTrack(audio)
    if (useMedia.getState().local === stream) useMedia.setState({ mic: false })
  })
  useMedia.setState({ local: stream, mic: !!audio?.enabled })
  peer?.setLocal(stream)
  warmCapture(stream)
}

// Cara kedua menyalakan mic: minta kamera + mic sekaligus, lalu tukar stream.
// Di iPhone permintaan getUserMedia kedua bisa mematikan stream kamera yang
// lama, jadi di sana ini yang dipakai lebih dulu.
async function swapWithMic(old: MediaStream): Promise<"ok" | CameraFailure> {
  const gen = cameraGen
  try {
    const fresh = await openCameraAndMic()
    if (gen !== cameraGen || useMedia.getState().local !== old) {
      stopStream(fresh)
      return "unknown"
    }
    stopStream(old)
    releaseCapture()
    adopt(fresh)
    return "ok"
  } catch (e) {
    return e instanceof CameraError ? e.reason : "unknown"
  }
}

export const media = {
  // Buka kamera sekali; panggilan berikutnya memakai stream yang sama.
  openCamera(): Promise<MediaStream> {
    const current = useMedia.getState().local
    if (current?.active) return Promise.resolve(current)
    if (opening) return opening
    useMedia.setState({ opening: true })
    const gen = cameraGen
    const pending: Promise<MediaStream> = openCamera()
      .then((stream) => {
        if (gen !== cameraGen) {
          stopStream(stream)
          throw new CameraError("unknown")
        }
        // Kamera dicabut / dipakai aplikasi lain → minta izin lagi (di adopt()).
        adopt(stream)
        return stream
      })
      .finally(() => {
        if (opening !== pending) return
        opening = null
        useMedia.setState({ opening: false })
      })
    opening = pending
    return pending
  },

  connect(opts: { selfId: string; polite: boolean; send: (signal: Signal) => void }) {
    peer?.close()
    peer = new PeerLink({ ...opts, onChange: (link) => useMedia.setState({ link, remote: link.remote }) })
    peer.setLocal(useMedia.getState().local)
  },

  // Foto resolusi penuh dari kamera lokal (dicerminkan).
  grab(): Promise<Blob> {
    const local = useMedia.getState().local
    return local ? grabFrame(local) : Promise.reject(new Error("no_camera"))
  },

  announce: () => peer?.announce(),
  signal: (signal: Signal) => peer?.handle(signal),
  reconnect: () => peer?.reconnect(),

  // Mic sudah pernah diizinkan di sesi ini (track ada) → nyala/mati instan.
  hasMicTrack: () => !!useMedia.getState().local?.getAudioTracks()[0],

  // Audio opsional, default mati (PRD R2). Mic baru diminta saat pertama
  // dinyalakan; panggil dari klik (quirk iOS). Pesan gagal diurus lembar izin mic.
  async setMic(on: boolean): Promise<"ok" | CameraFailure> {
    const { local, micBusy } = useMedia.getState()
    if (!local) return "unknown"
    const existing = local.getAudioTracks()[0]
    if (existing) {
      existing.enabled = on
      useMedia.setState({ mic: on })
      return "ok"
    }
    if (!on) return "ok"
    if (micBusy) return "ok"
    useMedia.setState({ micBusy: true })
    try {
      // iPhone: langsung minta kamera + mic sekaligus (lihat swapWithMic).
      if (isIOS()) return await swapWithMic(local)
      const track = await openMic()
      const video = local.getVideoTracks()[0]
      // Sebagian browser mematikan stream lama begitu mic dibuka: ulangi
      // dengan kamera + mic sekaligus supaya kameranya tidak ikut mati.
      if (useMedia.getState().local !== local || !video || video.readyState === "ended") {
        track.stop()
        return await swapWithMic(local)
      }
      track.addEventListener("ended", () => {
        local.removeTrack(track)
        if (useMedia.getState().local === local) useMedia.setState({ mic: false })
      })
      local.addTrack(track)
      peer?.syncLocal()
      useMedia.setState({ mic: true })
      return "ok"
    } catch (e) {
      const reason = e instanceof CameraError ? e.reason : "unknown"
      // Ditolak orangnya → panduan izin. Gagal lain → coba cara kedua.
      if (reason === "denied" || reason === "insecure") return reason
      return await swapWithMic(local)
    } finally {
      useMedia.setState({ micBusy: false })
    }
  },

  // Layar review: tidak ada video yang ditampilkan, jadi kamera & mic benar-
  // benar dilepas (lampu kamera di HP ikut mati). Dibuka lagi lewat wake().
  rest() {
    const { local, mic, resting } = useMedia.getState()
    if (!local || resting) return
    micBeforeRest = mic
    // `resting` disetel lebih dulu supaya kamera yang hilang di sini tidak
    // dianggap dicabut oleh store sesi.
    useMedia.setState({ resting: true, mic: false })
    peer?.detachLocal()
    stopStream(local)
    releaseCapture()
    useMedia.setState({ local: null })
  },

  // Kembali ke kamera (foto ulang / lobby); mic kembali seperti sebelum dijeda.
  // Kalau tadi mic nyala, kamera + mic dibuka sekaligus (satu permintaan saja,
  // penting di iPhone).
  async wake(): Promise<void> {
    if (!useMedia.getState().resting) return
    useMedia.setState({ resting: false })
    if (useMedia.getState().local?.active) return
    if (!micBeforeRest) {
      await media.openCamera()
      return
    }
    const gen = cameraGen
    try {
      const fresh = await openCameraAndMic()
      if (gen !== cameraGen) return stopStream(fresh)
      adopt(fresh)
    } catch {
      // Mic gagal (mis. dipakai aplikasi lain) → minimal kameranya hidup lagi.
      await media.openCamera()
    }
  },

  disconnect() {
    peer?.close()
    peer = null
    useMedia.setState({ link: IDLE_LINK, remote: null })
  },

  // Matikan kamera & sambungan (keluar room, sesi selesai, pindah halaman).
  stop() {
    cameraGen++
    opening = null
    media.disconnect()
    stopStream(useMedia.getState().local)
    releaseCapture()
    useMedia.setState({ local: null, mic: false, opening: false, resting: false })
  },
}
