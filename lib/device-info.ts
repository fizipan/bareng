// Info perangkat untuk kiriman Pusat bantuan, supaya bug gampang dicek.
// Tanpa lokasi (sesuai halaman Privasi). Semua nilai datar & pendek.
// `collectDeviceInfo` hanya jalan di browser; `parseUserAgent` juga dipakai
// admin (server) untuk kiriman lama yang belum punya meta.
export type DeviceInfo = Record<string, string | number | boolean>

type UAData = {
  getHighEntropyValues?: (hints: string[]) => Promise<{
    model?: string
    platform?: string
    platformVersion?: string
    fullVersionList?: { brand: string; version: string }[]
  }>
}

// Browser di dalam aplikasi (link sering dibuka dari chat/sosmed).
const IN_APP: [RegExp, string][] = [
  [/WhatsApp/i, "WhatsApp"],
  [/Instagram/i, "Instagram"],
  [/FBAN|FBAV|FB_IAB/i, "Facebook"],
  [/\bLine\//i, "LINE"],
  [/musical_ly|BytedanceWebview|TikTok/i, "TikTok"],
  [/Telegram/i, "Telegram"],
]

export function parseUserAgent(ua: string) {
  const pick = (re: RegExp) => ua.match(re)?.[1]
  let browser = "Tidak diketahui"
  let browserVersion = ""
  const b: [RegExp, string][] = [
    [/SamsungBrowser\/([\d.]+)/, "Samsung Internet"],
    [/EdgA?\/([\d.]+)|EdgiOS\/([\d.]+)/, "Edge"],
    [/OPR\/([\d.]+)/, "Opera"],
    [/(?:Firefox|FxiOS)\/([\d.]+)/, "Firefox"],
    [/(?:Chrome|CriOS)\/([\d.]+)/, "Chrome"],
    [/Version\/([\d.]+).*Safari/, "Safari"],
  ]
  for (const [re, name] of b) {
    const m = ua.match(re)
    if (m) {
      browser = name
      browserVersion = m[1] ?? m[2] ?? ""
      break
    }
  }

  let os = "Tidak diketahui"
  let osVersion = ""
  if (/iPhone|iPad|iPod/.test(ua)) {
    os = /iPad/.test(ua) ? "iPadOS" : "iOS"
    osVersion = (pick(/OS (\d+[_\d]*) like Mac/) ?? "").replace(/_/g, ".")
  } else if (/Android/.test(ua)) {
    os = "Android"
    osVersion = pick(/Android ([\d.]+)/) ?? ""
  } else if (/CrOS/.test(ua)) {
    os = "ChromeOS"
  } else if (/Mac OS X/.test(ua)) {
    os = "macOS"
    osVersion = (pick(/Mac OS X ([\d_]+)/) ?? "").replace(/_/g, ".")
  } else if (/Windows NT/.test(ua)) {
    os = "Windows"
    osVersion = pick(/Windows NT ([\d.]+)/) === "10.0" ? "10/11" : (pick(/Windows NT ([\d.]+)/) ?? "")
  } else if (/Linux/.test(ua)) {
    os = "Linux"
  }

  const model = /Android/.test(ua) ? pick(/Android [\d.]+; ([^;)]+?)(?: Build|\))/) : undefined
  const inApp = IN_APP.find(([re]) => re.test(ua))?.[1]
  return { browser, browserVersion, os, osVersion, model: model && model !== "K" ? model : undefined, inApp }
}

export async function collectDeviceInfo(): Promise<DeviceInfo> {
  const ua = navigator.userAgent
  const parsed = parseUserAgent(ua)
  const info: DeviceInfo = {
    browser: parsed.browser,
    os: parsed.os,
  }
  if (parsed.browserVersion) info.browserVersion = parsed.browserVersion
  if (parsed.osVersion) info.osVersion = parsed.osVersion
  if (parsed.model) info.model = parsed.model
  if (parsed.inApp) info.inApp = parsed.inApp

  // Chromium: model & versi yang lebih akurat lewat User-Agent Client Hints.
  const uad = (navigator as Navigator & { userAgentData?: UAData }).userAgentData
  if (uad?.getHighEntropyValues) {
    try {
      const hv = await uad.getHighEntropyValues(["model", "platformVersion", "fullVersionList"])
      if (hv.model) info.model = hv.model
      if (hv.platformVersion) {
        info.osVersion =
          info.os === "Windows" ? (Number(hv.platformVersion.split(".")[0]) >= 13 ? "11" : "10") : hv.platformVersion
      }
      const brand = hv.fullVersionList?.find((x) => !/Not.?A.?Brand|Chromium/i.test(x.brand))
      if (brand) {
        info.browser = brand.brand.replace(/^Google /, "").replace(/^Microsoft /, "")
        info.browserVersion = brand.version
      }
    } catch {}
  }

  const touch = navigator.maxTouchPoints || 0
  info.device = /iPad|Tablet/i.test(ua) || (/Macintosh/.test(ua) && touch > 1) ? "Tablet" : /Mobi|Android|iPhone/i.test(ua) ? "HP" : "Desktop"
  info.screen = `${screen.width}×${screen.height}`
  info.viewport = `${innerWidth}×${innerHeight}`
  info.dpr = Math.round(devicePixelRatio * 100) / 100
  info.touch = touch
  info.language = navigator.language
  info.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  info.online = navigator.onLine
  info.standalone =
    matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

  const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection
  if (conn?.effectiveType) info.connection = conn.effectiveType
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  if (memory) info.memory = memory
  if (navigator.hardwareConcurrency) info.cores = navigator.hardwareConcurrency

  const perm = async (name: string) => {
    try {
      return (await navigator.permissions.query({ name: name as PermissionName })).state
    } catch {
      return undefined
    }
  }
  const [camera, microphone] = await Promise.all([perm("camera"), perm("microphone")])
  if (camera) info.camera = camera
  if (microphone) info.microphone = microphone

  const screenName = document.querySelector<HTMLElement>("main[data-screen]")?.dataset.screen
  if (screenName) info.sessionScreen = screenName
  return info
}
