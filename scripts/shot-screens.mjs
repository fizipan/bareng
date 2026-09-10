// Screenshot tiap layar di /dev/screens dan prototipe (untuk dibandingkan).
// node scripts/shot-screens.mjs <outDir> [layar...]
import { chromium } from "@playwright/test"

const [outDir, ...only] = process.argv.slice(2)
const BASE = process.env.BASE_URL ?? "http://localhost:3000"
const SCREENS = [
  "1 · Landing", "2 · Undang", "3 · Gabung", "4 · Izin", "5 · Lobby", "6 · Capture", "7 · Review",
  "8 · Hasil", "9 · Paywall", "10 · Halaman", "11 · Error", "12 · Privasi", "13 · Ketentuan",
].filter((s) => !only.length || only.some((o) => s.includes(o)))

const browser = await chromium.launch({ channel: "chrome" })
for (const [name, url, frameSel] of [
  ["app", `${BASE}/dev/screens`, "aside + div"],
  ["proto", `${BASE}/_proto/index.html`, "aside + div"],
]) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 940 }, deviceScaleFactor: 2 })
  await page.goto(url)
  await page.waitForTimeout(1500)
  for (const label of SCREENS) {
    await page.locator("aside button", { hasText: label }).first().click()
    await page.waitForTimeout(label.startsWith("6") ? 900 : 700)
    const slug = label.split(" · ")[1].toLowerCase().replace(/\s+/g, "-")
    await page.locator(frameSel).first().screenshot({ path: `${outDir}/${name}-${slug}.png` })
    // Paywall di app berupa dialog modal; tutup dulu supaya panel bisa diklik lagi.
    await page.keyboard.press("Escape")
    await page.waitForTimeout(250)
  }
  await page.close()
}
await browser.close()
