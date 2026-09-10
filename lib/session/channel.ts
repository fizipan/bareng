"use client"

import type { RealtimeChannel } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"
import { roomSnapshotSchema, type RoomEvent, type RoomSnapshot } from "./room-state"

type Handlers = {
  onState: (state: RoomSnapshot, event: RoomEvent | null) => void
  onPresence: (participantIds: string[]) => void
  onResync: () => void
}

// Channel private `room:<id>`: snapshot state dari server + presence peserta.
// Sinyal WebRTC (M3) juga lewat channel ini.
export async function joinRoomChannel(roomId: string, participantId: string, handlers: Handlers) {
  const sb = supabase()
  await sb.realtime.setAuth()
  let subscribedOnce = false

  const channel: RealtimeChannel = sb
    .channel(`room:${roomId}`, { config: { private: true, presence: { key: participantId } } })
    .on("broadcast", { event: "room_state" }, ({ payload }) => {
      const parsed = roomSnapshotSchema.safeParse(payload?.state)
      if (parsed.success) handlers.onState(parsed.data, (payload?.event as RoomEvent) ?? null)
    })
    .on("presence", { event: "sync" }, () => {
      handlers.onPresence(Object.keys(channel.presenceState()))
    })
    .subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return
      await channel.track({ at: Date.now() })
      // Setelah sambung ulang, ambil snapshot terbaru supaya tidak ada event yang terlewat.
      if (subscribedOnce) handlers.onResync()
      subscribedOnce = true
    })

  return () => {
    channel.untrack().catch(() => {})
    sb.removeChannel(channel)
  }
}
