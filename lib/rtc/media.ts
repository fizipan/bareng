"use client"

// Kamera & mikrofon lokal. Kamera dibuka di resolusi penuh untuk capture (M4);
// preview yang dikirim ke pasangan diturunkan di pengirim WebRTC (peer.ts).

export type CameraFailure = "denied" | "missing" | "busy" | "insecure" | "unknown"

export class CameraError extends Error {
  constructor(public reason: CameraFailure) {
    super(reason)
  }
}

const VIDEO: MediaTrackConstraints = {
  facingMode: "user",
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  frameRate: { ideal: 30, max: 30 },
}

const AUDIO: MediaTrackConstraints = { echoCancellation: true, noiseSuppression: true, autoGainControl: true }

function failureOf(e: unknown): CameraFailure {
  switch ((e as DOMException | null)?.name) {
    case "NotAllowedError":
    case "SecurityError":
    case "PermissionDeniedError":
      return "denied"
    case "NotFoundError":
    case "OverconstrainedError":
    case "DevicesNotFoundError":
      return "missing"
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return "busy"
    default:
      return "unknown"
  }
}

export async function openCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new CameraError(window.isSecureContext ? "missing" : "insecure")
  }
  try {
    return await navigator.mediaDevices.getUserMedia({ video: VIDEO, audio: false })
  } catch (e) {
    throw new CameraError(failureOf(e))
  }
}

// Audio opsional & default mati (PRD R2): mic baru diminta saat dinyalakan.
export async function openMic(): Promise<MediaStreamTrack> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO })
    return stream.getAudioTracks()[0]
  } catch (e) {
    throw new CameraError(failureOf(e))
  }
}

// Kamera + mic sekaligus. Dipakai saat mic dinyalakan di iPhone (dan sebagai
// cadangan di perangkat lain): di sana getUserMedia kedua bisa mematikan
// stream kamera yang sedang jalan, jadi lebih aman minta dua-duanya lalu
// menukar stream-nya.
export async function openCameraAndMic(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new CameraError(window.isSecureContext ? "missing" : "insecure")
  }
  try {
    return await navigator.mediaDevices.getUserMedia({ video: VIDEO, audio: AUDIO })
  } catch (e) {
    throw new CameraError(failureOf(e))
  }
}

// iPhone/iPad (termasuk iPad yang mengaku Mac).
export const isIOS = () =>
  typeof navigator !== "undefined" &&
  (/iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1))

// Izin kamera/mic yang sudah pernah diberikan (tidak semua browser mendukung).
export async function devicePermission(name: "camera" | "microphone"): Promise<PermissionState | "unsupported"> {
  try {
    const status = await navigator.permissions.query({ name: name as PermissionName })
    return status.state
  } catch {
    return "unsupported"
  }
}

export const cameraPermission = () => devicePermission("camera")

export function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop())
}
