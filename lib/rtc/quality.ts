// Kualitas sambungan dari RTCPeerConnection.getStats() (PRD R2: bagus / lambat).

export type LinkQuality = "ok" | "lambat"

export type StatsSample = {
  at: number
  framesDecoded: number
  packetsLost: number
  packetsReceived: number
  rtt: number | null
  relay: boolean
}

const MIN_FPS = 12
const MAX_LOSS = 0.08
const MAX_RTT_S = 0.6

type Stat = Record<string, unknown> & { type: string; id: string }

export function readStats(report: RTCStatsReport, at = Date.now()): StatsSample {
  const sample: StatsSample = { at, framesDecoded: 0, packetsLost: 0, packetsReceived: 0, rtt: null, relay: false }
  const stats = [...(report as unknown as Map<string, Stat>).values()]
  let pair: Stat | undefined

  for (const s of stats) {
    if (s.type === "inbound-rtp" && s.kind === "video") {
      sample.framesDecoded += Number(s.framesDecoded ?? 0)
      sample.packetsLost += Number(s.packetsLost ?? 0)
      sample.packetsReceived += Number(s.packetsReceived ?? 0)
    }
    if (s.type === "transport" && typeof s.selectedCandidatePairId === "string") {
      pair = stats.find((p) => p.id === s.selectedCandidatePairId)
    }
  }
  // Safari/Firefox tidak selalu punya stat transport.
  pair ??= stats.find((s) => s.type === "candidate-pair" && s.nominated && s.state === "succeeded")

  if (pair) {
    if (typeof pair.currentRoundTripTime === "number") sample.rtt = pair.currentRoundTripTime
    const local = stats.find((s) => s.id === pair.localCandidateId)
    sample.relay = local?.candidateType === "relay"
  }
  return sample
}

// Satu sampel buruk belum tentu lemot; peer.ts butuh dua berturut-turut.
export function assessQuality(prev: StatsSample | null, cur: StatsSample): LinkQuality {
  if (cur.rtt !== null && cur.rtt > MAX_RTT_S) return "lambat"
  if (!prev || cur.at <= prev.at) return "ok"
  const seconds = (cur.at - prev.at) / 1000
  const frames = cur.framesDecoded - prev.framesDecoded
  const lost = Math.max(0, cur.packetsLost - prev.packetsLost)
  const received = Math.max(0, cur.packetsReceived - prev.packetsReceived)
  // Belum ada video masuk (pasangan belum nyalakan kamera): bukan urusan sinyal.
  if (prev.framesDecoded === 0 && frames === 0) return "ok"
  if (frames / seconds < MIN_FPS) return "lambat"
  if (lost + received > 0 && lost / (lost + received) > MAX_LOSS) return "lambat"
  return "ok"
}
