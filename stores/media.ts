"use client"

import { create } from "zustand"
import { CameraError, openCamera, openMic, stopStream } from "@/lib/rtc/media"
import { IDLE_LINK, PeerLink, type LinkState, type Signal } from "@/lib/rtc/peer"
import { warn } from "@/lib/toast"

// Kamera lokal + sambungan video ke pasangan. Hidup di luar React supaya
// tidak putus saat pindah layar (izin → lobby → capture → review).

type MediaState = {
  local: MediaStream | null
  remote: MediaStream | null
  link: LinkState
  opening: boolean
  mic: boolean
  micBusy: boolean
}

export const useMedia = create<MediaState>()(() => ({
  local: null,
  remote: null,
  link: IDLE_LINK,
  opening: false,
  mic: false,
  micBusy: false,
}))

let peer: PeerLink | null = null
let opening: Promise<MediaStream> | null = null
// Naik tiap stop(): kamera yang baru selesai dibuka setelah stop langsung dimatikan.
let cameraGen = 0

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
        // Kamera dicabut / dipakai aplikasi lain → minta izin lagi.
        stream.getVideoTracks()[0]?.addEventListener("ended", () => {
          if (useMedia.getState().local === stream) useMedia.setState({ local: null, mic: false })
        })
        useMedia.setState({ local: stream })
        peer?.setLocal(stream)
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

  announce: () => peer?.announce(),
  signal: (signal: Signal) => peer?.handle(signal),
  reconnect: () => peer?.reconnect(),

  // Audio opsional, default mati (PRD R2). Mic baru diminta saat pertama nyala.
  async toggleMic() {
    const { local, mic, micBusy } = useMedia.getState()
    if (!local || micBusy) return
    const existing = local.getAudioTracks()[0]
    if (existing) {
      existing.enabled = !mic
      useMedia.setState({ mic: !mic })
      return
    }
    useMedia.setState({ micBusy: true })
    try {
      const track = await openMic()
      local.addTrack(track)
      peer?.syncLocal()
      useMedia.setState({ mic: true })
    } catch (e) {
      warn(e instanceof CameraError && e.reason === "denied" ? "Mikrofon belum diizinkan" : "Mikrofon belum bisa dinyalakan")
    } finally {
      useMedia.setState({ micBusy: false })
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
    useMedia.setState({ local: null, mic: false, opening: false })
  },
}
