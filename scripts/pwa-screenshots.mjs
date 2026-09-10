// Screenshot untuk dialog pasang PWA (public/screenshots/*.webp).
// Jalankan dengan server lokal hidup: node scripts/pwa-screenshots.mjs [baseUrl]
import { execFileSync } from "node:child_process"
import { mkdirSync } from "node:fs"
import { chromium } from "@playwright/test"

const BASE = process.argv[2] ?? "http://localhost:3000"
const OUT = "public/screenshots"
mkdirSync(OUT, { recursive: true })

// Sembunyikan toast & indikator dev supaya screenshot bersih.
const CLEAN = "[data-sonner-toaster], nextjs-portal { display: none !important }"

const browser = await chromium.launch({ channel: "chrome" })

async function shot(page, name) {
  const png = `${OUT}/${name}.png`
  await page.screenshot({ path: png })
  // PNG → WebP (lebih kecil) lewat Pillow.
  execFileSync("python3", ["-c", `from PIL import Image; Image.open("${png}").save("${OUT}/${name}.webp", quality=82, method=6)`])
  execFileSync("rm", [png])
  console.log("✓", name)
}

// Mobile (narrow) 390×844 @2x → 780×1688
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await m.goto(BASE, { waitUntil: "networkidle" })
await m.addStyleTag({ content: CLEAN })
await m.waitForTimeout(600)
await shot(m, "narrow-landing")

await m.getByRole("button", { name: /Mulai foto bareng/ }).first().click()
await m.getByRole("heading", { name: "Nyalakan kamera" }).waitFor({ timeout: 15000 })
await m.addStyleTag({ content: CLEAN })
await m.getByRole("button", { name: "Izinkan kamera" }).click()
await m.getByText("Begini nanti hasilnya").waitFor()
await m.getByRole("radio", { name: /Polaroid ganda/ }).click()
await m.waitForTimeout(500)
await shot(m, "narrow-lobby")

await m.getByRole("button", { name: "Siap!" }).click()
await m.getByText(/Tahan pose/).waitFor({ timeout: 15000 })
// Tunggu foto pertama selesai supaya strip terisi, lalu ambil saat hitung mundur frame 2.
await m.getByText(/Foto\s*2\s*dari 4/).waitFor({ timeout: 15000 })
await m.getByText(/Tahan pose/).waitFor({ timeout: 15000 })
await m.waitForTimeout(250)
await shot(m, "narrow-capture")

const review = m.getByRole("heading", { name: "Empat foto, jadi." })
const shutter = m.getByRole("button", { name: "Ambil foto sekarang" })
while (!(await review.isVisible())) {
  if (await shutter.isVisible()) await shutter.click().catch(() => {})
  await m.waitForTimeout(250)
}
await m.getByRole("button", { name: "Jadikan photostrip" }).click()
await m.getByRole("heading", { name: "Jadi! Ini photostrip kalian." }).waitFor()
await m.waitForTimeout(1200)
await shot(m, "narrow-hasil")
await m.close()

// Desktop (wide) 1280×800 @1x
const d = await browser.newPage({ viewport: { width: 1280, height: 800 } })
await d.goto(BASE, { waitUntil: "networkidle" })
await d.addStyleTag({ content: CLEAN })
await d.waitForTimeout(600)
await shot(d, "wide-landing")
await d.locator("#template").scrollIntoViewIfNeeded()
await d.evaluate(() => window.scrollTo({ top: document.querySelector("#template").getBoundingClientRect().top + window.scrollY - 40, behavior: "instant" }))
await d.waitForTimeout(500)
await shot(d, "wide-template")
await d.close()
await browser.close()
