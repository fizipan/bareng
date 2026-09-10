// Screenshot halaman untuk cek visual: node scripts/shot.mjs <url> <out.png> [lebar] [tinggi] [--full]
// Memakai Chrome yang sudah terpasang (channel "chrome"), tanpa unduh browser.
import { chromium } from "@playwright/test"

const [url, out, width = "390", height = "844", ...flags] = process.argv.slice(2)
const mobile = Number(width) < 768
const browser = await chromium.launch({ channel: "chrome" })
const page = await browser.newPage({
  viewport: { width: Number(width), height: Number(height) },
  deviceScaleFactor: 2,
  isMobile: mobile,
  hasTouch: mobile,
})
await page.goto(url, { waitUntil: "networkidle" }).catch(() => page.goto(url))
await page.waitForTimeout(1200)
await page.screenshot({ path: out, fullPage: flags.includes("--full") })
await browser.close()
