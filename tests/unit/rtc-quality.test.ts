import { describe, expect, it } from "vitest"
import { assessQuality, readStats, type StatsSample } from "@/lib/rtc/quality"

const sample = (at: number, framesDecoded: number, extra: Partial<StatsSample> = {}): StatsSample => ({
  at,
  framesDecoded,
  packetsLost: 0,
  packetsReceived: framesDecoded * 10,
  rtt: 0.05,
  relay: false,
  ...extra,
})

describe("assessQuality", () => {
  it("24 fps & tanpa loss → ok", () => {
    expect(assessQuality(sample(0, 0), sample(2000, 48))).toBe("ok")
  })
  it("fps rendah → lambat", () => {
    expect(assessQuality(sample(0, 100), sample(2000, 110))).toBe("lambat")
  })
  it("packet loss tinggi → lambat", () => {
    const prev = sample(0, 100, { packetsReceived: 1000 })
    const cur = sample(2000, 148, { packetsReceived: 1400, packetsLost: 60 })
    expect(assessQuality(prev, cur)).toBe("lambat")
  })
  it("RTT > 600 ms → lambat", () => {
    expect(assessQuality(null, sample(0, 0, { rtt: 0.9 }))).toBe("lambat")
  })
  it("pasangan belum kirim video → bukan lemot", () => {
    expect(assessQuality(sample(0, 0), sample(2000, 0))).toBe("ok")
  })
})

describe("readStats", () => {
  it("baca video masuk, RTT & relay dari pasangan kandidat terpilih", () => {
    const report = new Map<string, Record<string, unknown>>([
      ["in", { id: "in", type: "inbound-rtp", kind: "video", framesDecoded: 120, packetsLost: 3, packetsReceived: 900 }],
      ["aud", { id: "aud", type: "inbound-rtp", kind: "audio", packetsLost: 50, packetsReceived: 100 }],
      ["t", { id: "t", type: "transport", selectedCandidatePairId: "p" }],
      ["p", { id: "p", type: "candidate-pair", currentRoundTripTime: 0.12, localCandidateId: "l" }],
      ["l", { id: "l", type: "local-candidate", candidateType: "relay" }],
    ])
    expect(readStats(report as unknown as RTCStatsReport, 5)).toEqual({
      at: 5,
      framesDecoded: 120,
      packetsLost: 3,
      packetsReceived: 900,
      rtt: 0.12,
      relay: true,
    })
  })
})
