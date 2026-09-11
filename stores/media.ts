"use client"

import { create } from "zustand"
import { grabFrame, releaseCapture, warmCapture } from "@/lib/rtc/capture"
import { CameraError, openCamera, openMic, stopStream, type CameraFailure } from "@/lib/rtc/media"
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
        warmCapture(stream)
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
      const track = await openMic()
      if (useMedia.getState().local !== local) {
        track.stop()
        return "unknown"
      }
      // Mic dicabut / dipakai aplikasi lain di tengah sesi.
      track.addEventListener("ended", () => {
        local.removeTrack(track)
        if (useMedia.getState().local === local) useMedia.setState({ mic: false })
      })
      local.addTrack(track)
      peer?.syncLocal()
      useMedia.setState({ mic: true })
      return "ok"
    } catch (e) {
      return e instanceof CameraError ? e.reason : "unknown"
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
    releaseCapture()
    useMedia.setState({ local: null, mic: false, opening: false })
  },
}
