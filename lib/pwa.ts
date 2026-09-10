// Ukuran splash iOS — samakan dengan daftar SPLASH di scripts/pwa-icons.py.
const SPLASH_SCREENS = [
  [440, 956, 3],
  [402, 874, 3],
  [430, 932, 3],
  [393, 852, 3],
  [428, 926, 3],
  [390, 844, 3],
  [375, 812, 3],
  [414, 896, 3],
  [414, 896, 2],
  [375, 667, 2],
  [820, 1180, 2],
  [1024, 1366, 2],
] as const

export const APPLE_STARTUP_IMAGES = SPLASH_SCREENS.map(([w, h, dpr]) => ({
  url: `/splash/splash-${w * dpr}x${h * dpr}.png`,
  media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`,
}))

// Screenshot untuk dialog pasang (Chrome "richer install UI").
// Dibuat ulang dengan: node scripts/pwa-screenshots.mjs
export const PWA_SCREENSHOTS = [
  { file: "narrow-landing", label: "Landing Bareng: foto bareng, walau jauh", form: "narrow" },
  { file: "narrow-lobby", label: "Lobby: lihat kamu dan dia berdampingan, pilih template", form: "narrow" },
  { file: "narrow-capture", label: "Hitung mundur serentak, foto langsung di dalam template", form: "narrow" },
  { file: "narrow-hasil", label: "Photostrip jadi, tinggal unduh atau bagikan", form: "narrow" },
  { file: "wide-landing", label: "Bareng di layar lebar", form: "wide" },
  { file: "wide-template", label: "Enam template photostrip", form: "wide" },
] as const
