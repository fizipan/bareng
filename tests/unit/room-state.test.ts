import { describe, expect, it } from "vitest"
import { deriveView, partnerEventMessage, shotPhase, type RoomSnapshot } from "@/lib/session/room-state"
import { estimateOffset } from "@/lib/sync/clock"

const shot = { idx: 1, v: 3, prompt: "Peace", prompt_at: 10_000, countdown_at: 11_600, capture_at: 14_600 }

describe("shotPhase", () => {
  it("sebelum prompt: idle di foto pertama, saving setelah ada foto", () => {
    expect(shotPhase(shot, 9_000, false).phase).toBe("idle")
    expect(shotPhase(shot, 9_000, true).phase).toBe("saving")
  })
  it("prompt → hitung mundur 3-2-1 → flash → saving", () => {
    expect(shotPhase(shot, 10_500, true)).toEqual({ phase: "prompt", count: 3 })
    expect(shotPhase(shot, 11_600, true)).toEqual({ phase: "count", count: 3 })
    expect(shotPhase(shot, 12_700, true)).toEqual({ phase: "count", count: 2 })
    expect(shotPhase(shot, 14_000, true)).toEqual({ phase: "count", count: 1 })
    expect(shotPhase(shot, 14_650, true).phase).toBe("flash")
    expect(shotPhase(shot, 15_000, true).phase).toBe("saving")
  })
  it("tanpa jadwal: idle", () => expect(shotPhase(null, 0, false).phase).toBe("idle"))
})

const base: RoomSnapshot = {
  id: "r1",
  code: "K7M2QX",
  status: "lobby",
  tier: "free",
  template_id: "film",
  filter_id: "none",
  current_shot: null,
  retake_queue: [],
  expires_at: 0,
  participants: [
    { id: "h", role: "host", nickname: "Rara", ready: false },
    { id: "g", role: "guest", nickname: null, ready: true },
  ],
  frames: [],
  result: null,
}
const local = { participantId: "h", camera: "granted" as const, showInvite: false, partnerOnline: true }

describe("deriveView", () => {
  it("host tanpa tamu → layar undang", () => {
    const v = deriveView({ ...base, status: "waiting", participants: [base.participants[0]] }, local)
    expect(v.screen).toBe("undang")
    expect(v.partner).toBeNull()
  })
  it("kamera belum diizinkan → izin; ditolak → error kamera", () => {
    expect(deriveView(base, { ...local, camera: "unknown" }).screen).toBe("izin")
    expect(deriveView(base, { ...local, camera: "denied" })).toMatchObject({ screen: "error", errorKind: "camera" })
  })
  it("status server → layar", () => {
    expect(deriveView(base, local).screen).toBe("lobby")
    expect(deriveView({ ...base, status: "capturing" }, local).screen).toBe("capture")
    expect(deriveView({ ...base, status: "review" }, local).screen).toBe("review")
    expect(deriveView({ ...base, status: "done" }, { ...local, camera: "unknown" }).screen).toBe("hasil")
    expect(deriveView({ ...base, status: "expired" }, local)).toMatchObject({ screen: "error", errorKind: "kadaluarsa" })
  })
  it("nama default & pasangan dari sudut pandang tamu", () => {
    const v = deriveView(base, { ...local, participantId: "g" })
    expect(v.role).toBe("guest")
    expect(v.me).toEqual({ name: "Kamu", ready: true })
    expect(v.partner).toMatchObject({ name: "Rara", ready: false, joined: true })
  })
  it("frame terisi hanya kalau kedua orang sudah memotret", () => {
    const v = deriveView(
      {
        ...base,
        status: "capturing",
        frames: [
          { idx: 0, participant_id: "h", status: "captured", path: null },
          { idx: 0, participant_id: "g", status: "captured", path: null },
          { idx: 1, participant_id: "h", status: "captured", path: null },
        ],
      },
      local
    )
    expect(v.frames.map((f) => !!f)).toEqual([true, false, false, false])
  })
  it("pasangan offline → koneksi putus", () => {
    expect(deriveView(base, { ...local, partnerOnline: false }).conn).toBe("putus")
  })
  it("sambungan video: lemot, mencoba lagi (n/3), lalu panduan manual", () => {
    const link = (status: "connected" | "reconnecting" | "failed", attempt = 0, quality: "ok" | "lambat" = "ok") => ({
      ...local,
      link: { status, attempt, quality },
    })
    expect(deriveView(base, link("connected", 0, "lambat")).conn).toBe("lambat")
    expect(deriveView(base, link("reconnecting", 2))).toMatchObject({ conn: "putus", reconnectAttempt: 2, screen: "lobby" })
    expect(deriveView(base, link("failed"))).toMatchObject({ screen: "error", errorKind: "putus" })
    // Di review foto sudah aman; tidak perlu menutup layar.
    expect(deriveView({ ...base, status: "review" }, link("failed")).screen).toBe("review")
  })
})

describe("partnerEventMessage", () => {
  const name = (id: string) => (id === "y2k" ? "Y2K neon" : id)
  it("pesan untuk aksi pasangan", () => {
    expect(partnerEventMessage({ type: "joined", by: "g" }, "Dimas", name)).toBe("Dimas masuk")
    expect(partnerEventMessage({ type: "template", by: "g", template_id: "y2k" }, "Dimas", name)).toBe(
      "Dimas ganti template ke Y2K neon"
    )
    expect(partnerEventMessage({ type: "retake", by: "g", indices: [1, 3] }, "Dimas", name)).toBe(
      "Dimas minta ulang foto 2 & 4"
    )
    expect(partnerEventMessage({ type: "captured", by: "g" }, "Dimas", name)).toBeNull()
  })
})

describe("estimateOffset", () => {
  it("pakai sampel dengan round-trip tersingkat", () => {
    const samples = [
      { t0: 0, server: 1_500, t1: 400 }, // rtt 400
      { t0: 1000, server: 2_050, t1: 1100 }, // rtt 100 → offset = 2050 + 50 - 1100 = 1000
      { t0: 2000, server: 3_300, t1: 2300 },
    ]
    expect(estimateOffset(samples)).toBe(1000)
  })
  it("tanpa sampel → 0", () => expect(estimateOffset([])).toBe(0))
})
