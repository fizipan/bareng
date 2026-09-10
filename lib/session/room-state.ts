import { z } from "zod"
import type { ErrorKind } from "@/lib/content/errors"
import { placeholderFrame } from "./demo"
import type { Conn, Frame, Person, Role, Screen, ShotPhase, Tier } from "./types"

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
    z.object({ idx: z.number(), participant_id: z.string(), status: z.string(), path: z.string().nullable() })
  ),
  result: z.object({ slug: z.string(), created_at: z.number() }).nullable(),
})

export type RoomSnapshot = z.infer<typeof roomSnapshotSchema>
export type ServerShot = z.infer<typeof shotSchema>
export type RoomEvent = { type: string; by: string | null; [key: string]: unknown }

export type Camera = "unknown" | "granted" | "denied"

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
  retakeQueue: number[]
  result: { slug: string; createdAt: string } | null
  conn: Conn
}

// Petakan snapshot server + keadaan lokal perangkat ke layar yang tampil.
export function deriveView(
  snap: RoomSnapshot,
  local: { participantId: string; camera: Camera; showInvite: boolean; partnerOnline: boolean }
): RoomView {
  const me = snap.participants.find((p) => p.id === local.participantId)
  const role: Role = me?.role ?? "guest"
  const partnerRow = snap.participants.find((p) => p.id !== local.participantId) ?? null
  const host = snap.participants.find((p) => p.role === "host")
  const guest = snap.participants.find((p) => p.role === "guest")

  const frames = [0, 1, 2, 3].map((idx) => {
    const mine = (id?: string) => snap.frames.some((f) => f.idx === idx && f.participant_id === id)
    return host && guest && mine(host.id) && mine(guest.id) ? placeholderFrame(idx) : null
  })

  let screen: Screen
  let errorKind: ErrorKind | undefined
  if (snap.status === "expired") {
    screen = "error"
    errorKind = "kadaluarsa"
  } else if (role === "host" && (snap.status === "waiting" || local.showInvite)) {
    screen = "undang"
  } else if (local.camera === "denied") {
    screen = "error"
    errorKind = "camera"
  } else if (local.camera !== "granted" && snap.status !== "done") {
    screen = "izin"
  } else if (snap.status === "capturing") {
    screen = "capture"
  } else if (snap.status === "review") {
    screen = "review"
  } else if (snap.status === "done") {
    screen = "hasil"
  } else {
    screen = "lobby"
  }

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
    retakeQueue: snap.retake_queue,
    result: snap.result ? { slug: snap.result.slug, createdAt: new Date(snap.result.created_at).toISOString() } : null,
    conn: partnerRow && !local.partnerOnline ? "putus" : "ok",
  }
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
    case "done":
      return "Photostrip kalian jadi"
    case "upgraded":
      return "Sesi jadi premium"
    case "left":
      return `${partnerName} keluar dari room`
    default:
      return null
  }
}
