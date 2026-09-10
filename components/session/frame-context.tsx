"use client"

import { createContext, useContext } from "react"

// Diisi /dev/screens: overlay (paywall) dirender di dalam bingkai HP dan
// selalu pakai versi mobile, bukan mengikuti lebar jendela desktop.
export const FrameContext = createContext<{ container: HTMLElement | null } | null>(null)

export const useFrame = () => useContext(FrameContext)
