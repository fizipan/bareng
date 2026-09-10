// Sinkron jam dengan server (NTP sederhana): ambil beberapa sampel, pakai yang
// round-trip-nya paling singkat karena paling sedikit bias jaringan.
export type ClockSample = { t0: number; server: number; t1: number }

// offset: serverNow ≈ Date.now() + offset
export function estimateOffset(samples: ClockSample[]) {
  if (!samples.length) return 0
  const best = samples.reduce((a, b) => (b.t1 - b.t0 < a.t1 - a.t0 ? b : a))
  return best.server + (best.t1 - best.t0) / 2 - best.t1
}

export async function measureOffset(fetchServerNow: () => Promise<number>, count = 5) {
  const samples: ClockSample[] = []
  for (let i = 0; i < count; i++) {
    const t0 = Date.now()
    try {
      const server = await fetchServerNow()
      samples.push({ t0, server, t1: Date.now() })
    } catch {
      // Sampel gagal dilewati; sisanya cukup.
    }
  }
  return estimateOffset(samples)
}
