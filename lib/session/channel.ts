"use client"

import type { RealtimeChannel } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"
import { roomSnapshotSchema, type RoomEvent, type RoomSnapshot } from "./room-state"

type Handlers = {
  onState: (state: RoomSnapshot, event: RoomEvent | null) => void
  // mics: participant id → mic nyala (dari presence, jadi ikut hilang saat keluar).
  onPresence: (participantIds: string[], mics: Record<string, boolean>) => void
  onResync: () => void
  onSignal: (payload: unknown) => void
  onSubscribed: () => void
}

export type RoomChannel = {
  send: (event: "signal", payload: object) => void
  setMic: (on: boolean) => void
  leave: () => void
}

// Channel private `room:<id>`: snapshot state dari server, presence peserta
// (termasuk status mic), dan sinyal WebRTC antar dua HP (offer/answer/ICE).
export async function joinRoomChannel(roomId: string, participantId: string, handlers: Handlers): Promise<RoomChannel> {
  const sb = supabase()
  await sb.realtime.setAuth()
  let subscribedOnce = false
  let joined = false
  let meta = { at: Date.now(), mic: false }

  const channel: RealtimeChannel = sb
    .channel(`room:${roomId}`, { config: { private: true, presence: { key: participantId } } })
    .on("broadcast", { event: "room_state" }, ({ payload }) => {
      const parsed = roomSnapshotSchema.safeParse(payload?.state)
      if (parsed.success) handlers.onState(parsed.data, (payload?.event as RoomEvent) ?? null)
    })
    .on("broadcast", { event: "signal" }, ({ payload }) => handlers.onSignal(payload))
    .on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<{ mic?: boolean }>()
      const mics = Object.fromEntries(Object.entries(state).map(([id, metas]) => [id, metas.some((m) => m.mic === true)]))
      handlers.onPresence(Object.keys(state), mics)
    })
    .subscribe(async (status) => {
      joined = status === "SUBSCRIBED"
      if (!joined) return
      await channel.track(meta)
      // Setelah sambung ulang, ambil snapshot terbaru supaya tidak ada event yang terlewat.
      if (subscribedOnce) handlers.onResync()
      subscribedOnce = true
      handlers.onSubscribed()
    })

  return {
    send: (event, payload) => {
      void channel.send({ type: "broadcast", event, payload })
    },
    setMic: (on) => {
      if (meta.mic === on) return
      meta = { ...meta, mic: on }
      if (joined) channel.track(meta).catch(() => {})
    },
    leave: () => {
      channel.untrack().catch(() => {})
      sb.removeChannel(channel)
    },
  }
}
