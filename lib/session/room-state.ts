import { z } from "zod"
import type { ErrorKind } from "@/lib/content/errors"
import { placeholderFrame } from "./demo"
import type { Conn, Frame, FrameSource, Person, Role, Screen, SessionResult, ShotPhase, Tier } from "./types"

// Snapshot room dari server (private.room_state). Divalidasi supaya payload
// realtime yang aneh tidak merusak UI.
const shotSchema = z.object({
  idx: z.number().int().min(0).max(3),
  v: z.number().int(),
  prompt: z.string(),
  prompt_at: z.number(),
  countdown_at: z.number(),
  capture_at: z.number(),
})

export const roomSnapshotSchema = z.object({
  id: z.string(),
  code: z.string(),
  status: z.enum(["waiting", "lobby", "capturing", "review", "done", "expired"]),
  tier: z.enum(["free", "premium"]),
  template_id: z.string(),
  filter_id: z.string(),
  current_shot: shotSchema.nullable(),
  retake_queue: z.array(z.number()),
  expires_at: z.number(),
  participants: z.array(
    z.object({ id: z.string(), role: z.enum(["host", "guest"]), nickname: z.string().nullable(), ready: z.boolean() })
  ),
  frames: z.array(
    z.object({
      idx: z.number(),
      participant_id: z.string(),
      status: z.string(),
      path: z.string().nullable(),
      v: z.number().int(),
    })
  ),
  result: z
    .object({
      slug: z.string(),
      created_at: z.number(),
      image_path: z.string().nullable().optional(),
      names: z.string().nullable().optional(),
      expires_at: z.number().nullable().optional(),
    })
    .nullable(),
})

export type RoomSnapshot = z.infer<typeof roomSnapshotSchema>
export type ServerShot = z.infer<typeof shotSchema>
export type RoomEvent = { type: string; by: string | null; [key: string]: unknown }

export type Camera = "unknown" | "granted" | "denied"

// Ringkasan sambungan video (lib/rtc/peer.ts) yang memengaruhi layar.
export type LinkView = {
  status: "idle" | "connecting" | "connected" | "reconnecting" | "failed"
  attempt: number
  quality: "ok" | "lambat"
}

// Fase satu foto dihitung dari jam server (sudah dikoreksi offset).
export function shotPhase(shot: ServerShot | null, serverNow: number, anyFrameTaken: boolean): {
  phase: ShotPhase
  count: number
} {
  if (!shot) return { phase: "idle", count: 3 }
  if (serverNow < shot.prompt_at) return { phase: anyFrameTaken ? "saving" : "idle", count: 3 }
  if (serverNow < shot.countdown_at) return { phase: "prompt", count: 3 }
  if (serverNow < shot.capture_at) {
    return { phase: "count", count: Math.min(3, Math.max(1, Math.ceil((shot.capture_at - serverNow) / 1000))) }
  }
  if (serverNow < shot.capture_at + 160) return { phase: "flash", count: 1 }
  return { phase: "saving", count: 1 }
}

export type RoomView = {
  code: string
  role: Role
  screen: Screen
  errorKind?: ErrorKind
  tier: Tier
  templateId: string
  filterId: string
  me: Person
  partner: (Person & { joined: boolean; id: string }) | null
  frames: (Frame | null)[]
  framesReady: boolean
  retakeQueue: number[]
  result: SessionResult | null
  conn: Conn
  reconnectAttempt: number
}

// Pill koneksi PRD §15.5: jujur soal keadaan sambungan ke pasangan.
function connOf(partnerPresent: boolean, partnerOnline: boolean, link?: LinkView): { conn: Conn; attempt: number } {
  if (!partnerPresent) return { conn: "ok", attempt: 0 }
  if (link?.status === "reconnecting") return { conn: "putus", attempt: link.attempt }
  if (!partnerOnline || link?.status === "failed") return { conn: "putus", attempt: 0 }
  if (link?.status === "connected" && link.quality === "lambat") return { conn: "lambat", attempt: 0 }
  return { conn: "ok", attempt: 0 }
}

// Petakan snapshot server + keadaan lokal perangkat ke layar yang tampil.
export function deriveView(
  snap: RoomSnapshot,
  local: {
    participantId: string
    camera: Camera
    showInvite: boolean
    partnerOnline: boolean
    link?: LinkView
    // Foto sendiri di HP ini (`idx:v` → URL lokal) & URL bertanda tangan (path → URL).
    images?: { local: Record<string, string>; remote: Record<string, string> }
  }
): RoomView {
  const me = snap.participants.find((p) => p.id === local.participantId)
  const role: Role = me?.role ?? "guest"
  const partnerRow = snap.participants.find((p) => p.id !== local.participantId) ?? null
  const host = snap.participants.find((p) => p.role === "host")
  const guest = snap.participants.find((p) => p.role === "guest")

  // Frame tampil begitu dua orang sudah memotret; tiap setengahnya foto asli
  // (lokal atau dari Storage) atau "masih dikirim".
  const images = local.images
  const frames = [0, 1, 2, 3].map((idx): Frame | null => {
    const rowOf = (id?: string) => snap.frames.find((f) => f.idx === idx && f.participant_id === id)
    const a = rowOf(host?.id)
    const b = rowOf(guest?.id)
    if (!a || !b) return null
    if (!images) return placeholderFrame(idx)
    const source = (row: RoomSnapshot["frames"][number]): FrameSource => {
      const url =
        (row.participant_id === local.participantId ? images.local[`${idx}:${row.v}`] : undefined) ??
        (row.path ? images.remote[row.path] : undefined)
      return url ? { kind: "image", url } : { kind: "pending" }
    }
    return { a: source(a), b: source(b) }
  })

  let screen: Screen
  let errorKind: ErrorKind | undefined
  if (snap.status === "expired") {
    screen = "error"
    errorKind = "kadaluarsa"
  } else if (snap.status === "done") {
    screen = "hasil"
  } else if (role === "host" && (snap.status === "waiting" || local.showInvite)) {
    screen = "undang"
  } else if (local.camera === "denied") {
    screen = "error"
    errorKind = "camera"
  } else if (local.camera !== "granted") {
    screen = "izin"
  } else if (partnerRow && local.link?.status === "failed" && snap.status !== "review") {
    // Sambung ulang otomatis sudah 3× gagal: tampilkan panduan manual.
    screen = "error"
    errorKind = "putus"
  } else if (snap.status === "capturing") {
    screen = "capture"
  } else if (snap.status === "review") {
    screen = "review"
  } else {
    screen = "lobby"
  }
  const { conn, attempt } = connOf(!!partnerRow, local.partnerOnline, local.link)

  return {
    code: snap.code,
    role,
    screen,
    errorKind,
    tier: snap.tier,
    templateId: snap.template_id,
    filterId: snap.filter_id,
    me: { name: me?.nickname ?? "Kamu", ready: me?.ready ?? false },
    partner: partnerRow
      ? { id: partnerRow.id, name: partnerRow.nickname ?? "Dia", ready: partnerRow.ready, joined: true }
      : null,
    frames,
    framesReady: snap.frames.filter((f) => f.status === "uploaded").length >= 8,
    retakeQueue: snap.retake_queue,
    result: snap.result
      ? {
          slug: snap.result.slug,
          createdAt: new Date(snap.result.created_at).toISOString(),
          imagePath: snap.result.image_path ?? null,
          names: snap.result.names ?? null,
          expiresAt: snap.result.expires_at ? new Date(snap.result.expires_at).toISOString() : null,
        }
      : null,
    conn,
    reconnectAttempt: attempt,
  }
}

// Nama berdua untuk template/share: "host & tamu" kalau keduanya mengisi nama
// panggilan (aturan yang sama dengan results.names di server), selain itu null.
export function stripNamesOf(snapshot: RoomSnapshot | null) {
  const nick = (role: "host" | "guest") => snapshot?.participants.find((p) => p.role === role)?.nickname
  const host = nick("host")
  const guest = nick("guest")
  return host && guest ? `${host} & ${guest}` : null
}

// Toast untuk aksi yang dilakukan pasangan (aksi sendiri sudah ada toast lokal).
export function partnerEventMessage(event: RoomEvent, partnerName: string, templateName: (id: string) => string) {
  switch (event.type) {
    case "joined":
      return `${partnerName} masuk`
    case "template":
      return `${partnerName} ganti template ke ${templateName(String(event.template_id))}`
    case "filter":
      return `${partnerName} ganti filter`
    case "ready":
      return `${partnerName} sudah siap`
    case "retake": {
      const list = (event.indices as number[] | undefined)?.map((i) => i + 1).join(" & ")
      return list ? `${partnerName} minta ulang foto ${list}` : null
    }
    // "done" tanpa toast: layar hasil sudah bilang "Jadi!".
    case "upgraded":
      return "Sesi jadi premium"
    case "left":
      return `${partnerName} keluar dari room`
    case "deleted":
      return `${partnerName} menghapus photostrip ini`
    default:
      return null
  }
}
