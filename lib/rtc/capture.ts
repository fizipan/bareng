"use client"

// Ambil foto dari stream kamera LOKAL (bukan video pasangan) di resolusi
// penuh (PRD R3). Hasilnya dicerminkan, sama seperti yang terlihat di layar.
// Sumbernya satu <video> tersembunyi yang terus berjalan, jadi saat hitungan
// habis tidak ada jeda memuat.

const MAX_EDGE = 1920
const QUALITY = 0.88

let video: HTMLVideoElement | null = null

function sourceFor(stream: MediaStream) {
  if (!video) {
    video = document.createElement("video")
    video.muted = true
    video.playsInline = true
    video.setAttribute("playsinline", "")
    video.setAttribute("aria-hidden", "true")
    // iOS Safari hanya mendekode video yang ada di DOM.
    Object.assign(video.style, {
      position: "fixed",
      left: "0",
      top: "0",
      width: "1px",
      height: "1px",
      opacity: "0",
      pointerEvents: "none",
    })
    document.body.appendChild(video)
  }
  if (video.srcObject !== stream) {
    video.srcObject = stream
    video.play().catch(() => {})
  }
  return video
}

// Panggil begitu kamera nyala supaya capture pertama langsung siap.
export function warmCapture(stream: MediaStream) {
  sourceFor(stream)
}

export function releaseCapture() {
  if (!video) return
  video.srcObject = null
  video.remove()
  video = null
}

export async function grabFrame(stream: MediaStream): Promise<Blob> {
  const source = sourceFor(stream)
  if (source.readyState < 2) {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("camera_not_ready")), 2000)
      source.addEventListener(
        "loadeddata",
        () => {
          clearTimeout(timer)
          resolve()
        },
        { once: true }
      )
    })
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(source.videoWidth, source.videoHeight))
  const width = Math.round(source.videoWidth * scale)
  const height = Math.round(source.videoHeight * scale)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("no_canvas")
  ctx.translate(width, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(source, 0, 0, width, height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode_failed"))), "image/jpeg", QUALITY)
  )
}
