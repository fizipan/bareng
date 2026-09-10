"use client"

import { useEffect, useRef, type CSSProperties } from "react"
import { cn } from "@/lib/utils"

// <video> dari MediaStream. Selalu tanpa suara (audio pasangan diputar
// RemoteAudio) dan dicerminkan seperti photobooth: kamu & dia terlihat persis
// seperti nanti di photostrip.
export function LiveVideo({
  stream,
  feed,
  className,
  style,
}: {
  stream: MediaStream
  feed: "local" | "remote"
  className?: string
  style?: CSSProperties
}) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    video.srcObject = stream
    video.play().catch(() => {})
    return () => {
      video.srcObject = null
    }
  }, [stream])

  return (
    <video
      ref={ref}
      data-feed={feed}
      autoPlay
      playsInline
      muted
      disablePictureInPicture
      className={cn("absolute inset-0 size-full -scale-x-100 object-cover", className)}
      style={style}
    />
  )
}
