"use client"

// Suara hitung mundur & shutter disintesis Web Audio: tanpa file audio, tanpa
// urusan lisensi. Browser (terutama iOS) baru mengizinkan audio setelah
// sentuhan, jadi `unlockSounds()` dipanggil dari tombol Siap / Izinkan kamera.

let ctx: AudioContext | null = null

export function unlockSounds() {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === "suspended") void ctx.resume()
  } catch {
    ctx = null
  }
}

export function playTick() {
  if (!ctx) return
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = "sine"
  osc.frequency.value = 880
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.18, t + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.1)
}

// "Cekrek": derau pendek yang cepat hilang + ketukan rendah.
export function playShutter() {
  if (!ctx) return
  const t = ctx.currentTime
  const length = Math.floor(ctx.sampleRate * 0.12)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3
  const noise = ctx.createBufferSource()
  noise.buffer = buffer
  const highpass = ctx.createBiquadFilter()
  highpass.type = "highpass"
  highpass.frequency.value = 1400
  const noiseGain = ctx.createGain()
  noiseGain.gain.value = 0.35
  noise.connect(highpass).connect(noiseGain).connect(ctx.destination)
  noise.start(t)

  const thump = ctx.createOscillator()
  const thumpGain = ctx.createGain()
  thump.type = "square"
  thump.frequency.setValueAtTime(140, t)
  thump.frequency.exponentialRampToValueAtTime(60, t + 0.05)
  thumpGain.gain.setValueAtTime(0.12, t)
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06)
  thump.connect(thumpGain).connect(ctx.destination)
  thump.start(t)
  thump.stop(t + 0.07)
}
