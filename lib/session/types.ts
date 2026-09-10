import type { ErrorKind } from "@/lib/content/errors"
import type { FilterId } from "@/lib/templates/filters"

// Model sesi yang dibaca layar. Sumber datanya bisa simulasi (M1) atau
// Supabase + WebRTC (M2+); layar tidak perlu tahu bedanya.

export type Screen = "connecting" | "undang" | "izin" | "lobby" | "capture" | "review" | "hasil" | "error"
export type Role = "host" | "guest"
export type Tier = "free" | "premium"
export type Conn = "ok" | "lambat" | "putus"
export type ShotPhase = "idle" | "prompt" | "count" | "flash" | "saving"

// Isi satu setengah slot: foto asli, masih dikirim, atau pola placeholder
// (galeri dev & contoh).
export type FrameSource = { kind: "image"; url: string } | { kind: "pending" } | { kind: "look"; look: number }

// A = host, B = tamu. Urutan ini sama di kedua HP supaya strip-nya identik.
export type Frame = { a: FrameSource; b: FrameSource }

export type Person = { name: string; ready: boolean }

// Hasil sesi: link publik + file photostrip jadi (null sampai terunggah).
export type SessionResult = {
  slug: string
  createdAt: string
  imagePath: string | null
  names: string | null
  expiresAt: string | null
}

export type SessionState = {
  code: string
  role: Role
  screen: Screen
  errorKind: ErrorKind
  conn: Conn
  reconnectAttempt: number
  tier: Tier
  templateId: string
  filterId: FilterId
  sound: boolean
  me: Person
  partner: (Person & { joined: boolean; id?: string }) | null
  shot: { idx: number; phase: ShotPhase; count: number; prompt: string }
  frames: (Frame | null)[]
  // Delapan foto (4 × berdua) sudah sampai di server → boleh jadi photostrip.
  framesReady: boolean
  retakeQueue: number[]
  selected: number[]
  paywall: { open: boolean; pendingTemplateId: string | null; paying: boolean }
  result: SessionResult | null
}

export type SessionActions = {
  createRoom: () => Promise<string>
  enterRoom: (code: string) => Promise<void>
  fail: (kind: ErrorKind) => void
  leave: () => void
  backToInvite: () => void
  closeInvite: () => void
  setNickname: (name: string) => void
  allowCamera: () => Promise<void>
  denyCamera: () => void
  copyInviteLink: () => void
  shareWhatsApp: () => void
  setTemplate: (id: string) => void
  setFilter: (id: FilterId) => void
  toggleReady: () => void
  skipPrompt: () => void
  toggleSelect: (idx: number) => void
  clearSelect: () => void
  retakeSelected: () => void
  retakeAll: () => void
  makeStrip: () => void
  download: () => Promise<void>
  share: () => void
  copyResultLink: () => void
  deleteResult: () => Promise<void>
  openPaywall: () => void
  closePaywall: () => void
  pay: () => void
  toggleSound: () => void
  errorAction: () => void
  reset: () => void
}

// Kontrol khusus halaman /dev/screens (pengganti panel samping prototipe).
export type DevActions = {
  devJump: (screen: Screen) => void
  devSetTier: (tier: Tier) => void
  devSetConn: (conn: Conn) => void
  devSetError: (kind: ErrorKind) => void
  devSimulateJoin: () => void
}
