"use client"

import type { ErrorKind } from "@/lib/content/errors"
import { ensureSession, supabase } from "@/lib/supabase/client"
import { roomSnapshotSchema, type RoomSnapshot } from "./room-state"
import type { PaywallCharge } from "./types"

// Error dari RPC (raise exception '<kode>') → jenis error UI.
export class RoomError extends Error {
  constructor(
    public code: string,
    public kind: ErrorKind | null
  ) {
    super(code)
  }
}

const KIND: Record<string, ErrorKind> = {
  room_not_found: "tidak-ada",
  room_full: "penuh",
  room_expired: "kadaluarsa",
  not_participant: "tidak-ada",
}

function toRoomError(error: { message?: string } | null): RoomError {
  const code = error?.message?.match(/^[a-z_]+$/)?.[0] ?? error?.message ?? "unknown"
  return new RoomError(code, KIND[code] ?? null)
}

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  await ensureSession()
  // RPC bertipe; nama fungsi dinamis di sini supaya error mapping satu tempat.
  const { data, error } = await (supabase().rpc as unknown as (f: string, a?: object) => Promise<{ data: T; error: { message: string } | null }>)(
    fn,
    args
  )
  if (error) throw toRoomError(error)
  return data
}

// Route server (pembayaran): token sesi anonim ikut sebagai Bearer.
async function post<T>(path: string, body: object): Promise<T> {
  const session = await ensureSession()
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new RoomError(typeof data.error === "string" ? data.error : "failed", null)
  return data as T
}

export const api = {
  createRoom: () => call<{ room_id: string; code: string }>("create_room"),
  joinRoom: (code: string) =>
    call<{ room_id: string; participant_id: string; role: "host" | "guest" }>("join_room", { p_code: code }),
  getRoom: async (roomId: string): Promise<RoomSnapshot> =>
    roomSnapshotSchema.parse(await call<unknown>("get_room", { p_room: roomId })),
  setNickname: (roomId: string, nickname: string) => call<void>("set_nickname", { p_room: roomId, p_nickname: nickname }),
  setTemplate: (roomId: string, templateId: string) => call<void>("set_template", { p_room: roomId, p_template: templateId }),
  setFilter: (roomId: string, filterId: string) => call<void>("set_filter", { p_room: roomId, p_filter: filterId }),
  setReady: (roomId: string, ready: boolean) => call<void>("set_ready", { p_room: roomId, p_ready: ready }),
  skipPrompt: (roomId: string, version: number) => call<void>("skip_prompt", { p_room: roomId, p_version: version }),
  frameCaptured: (roomId: string, idx: number, version: number, capturedAt: number) =>
    call<void>("frame_captured", { p_room: roomId, p_idx: idx, p_version: version, p_captured_at: capturedAt }),
  frameUploaded: (roomId: string, idx: number, version: number, path: string) =>
    call<void>("frame_uploaded", { p_room: roomId, p_idx: idx, p_version: version, p_path: path }),
  resumeShot: (roomId: string, version: number) => call<void>("resume_shot", { p_room: roomId, p_version: version }),
  requestRetake: (roomId: string, indices: number[]) => call<void>("request_retake", { p_room: roomId, p_indices: indices }),
  finishSession: (roomId: string) => call<string>("finish_session", { p_room: roomId }),
  leaveRoom: (roomId: string) => call<void>("leave_room", { p_room: roomId }),
  startPayment: (roomId: string, templateId: string | null) =>
    post<PaywallCharge>("/api/payments", { roomId, templateId }),
  simulatePayment: (orderId: string, outcome: "paid" | "failed") =>
    post<{ ok: boolean; status?: string }>("/api/payments/mock", { orderId, outcome }),
  deleteResult: (slug: string) => call<void>("delete_result", { p_slug: slug }),
  setResultImage: (slug: string, path: string) => call<void>("set_result_image", { p_slug: slug, p_path: path }),
  // Buang file hasil yang baru dihapus sekarang juga (bukan menunggu jadwal).
  purgeResult: (slug: string) => supabase().functions.invoke("cleanup", { body: { slug } }),
  serverNow: async () => {
    const { data, error } = await supabase().rpc("server_now")
    if (error) throw error
    return data
  },
}
