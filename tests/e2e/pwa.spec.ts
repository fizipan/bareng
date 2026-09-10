import { expect, test } from "@playwright/test"

// Service worker hanya aktif di build production. Jalankan dengan server
// `next start` + proxy tes (tests/support/sw-bump-proxy.mjs) di depannya:
// PWA=1 BASE_URL=http://localhost:3200 pnpm exec playwright test pwa
test.skip(!process.env.PWA, "butuh server production (next start)")
test.use({ serviceWorkers: "allow" })

test("manifest lengkap & semua aset bisa diakses", async ({ page, request }) => {
  const res = await request.get("/manifest.webmanifest")
  expect(res.ok()).toBe(true)
  const m = await res.json()
  expect(m.name).toContain("Bareng")
  expect(m.display).toBe("standalone")
  // Status bar aplikasi terpasang (mode gelap Android) memakai warna gelap.
  expect(m.theme_color).toBe("#16141D")
  expect(m.icons.some((i: { sizes: string }) => i.sizes === "512x512")).toBe(true)
  expect(m.icons.some((i: { purpose: string }) => i.purpose === "maskable")).toBe(true)
  expect(m.screenshots.filter((s: { form_factor: string }) => s.form_factor === "narrow").length).toBeGreaterThan(0)
  expect(m.screenshots.filter((s: { form_factor: string }) => s.form_factor === "wide").length).toBeGreaterThan(0)
  const urls = [...m.icons, ...m.screenshots, ...m.shortcuts.flatMap((s: { icons: object[] }) => s.icons)].map(
    (i: { src: string }) => i.src
  )
  for (const url of urls) expect((await request.get(url)).status(), url).toBe(200)
  for (const s of m.shortcuts) expect((await request.get(s.url)).status(), s.url).toBe(200)

  await page.goto("/")
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", /manifest\.webmanifest/)
  await expect(page.locator('meta[name="mobile-web-app-capable"], meta[name="apple-mobile-web-app-capable"]').first()).toHaveAttribute("content", "yes")
  expect(await page.locator('link[rel="apple-touch-startup-image"]').count()).toBeGreaterThan(5)
})

test("bisa dipasang (Chrome installability)", async ({ page }) => {
  await page.goto("/")
  await page.evaluate(() => navigator.serviceWorker.ready)
  const cdp = await page.context().newCDPSession(page)
  const { installabilityErrors } = await cdp.send("Page.getInstallabilityErrors")
  // Konteks Playwright selalu incognito; selain itu tidak boleh ada error.
  expect(installabilityErrors.filter((e) => e.errorId !== "in-incognito")).toEqual([])
})

test("service worker aktif & halaman tetap terbuka saat offline", async ({ page, context }) => {
  await page.goto("/")
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  // Kunjungi halaman lain dulu supaya asetnya ikut tersimpan.
  await page.goto("/gabung")
  await page.goto("/")

  await context.setOffline(true)
  await page.goto("/")
  await expect(page.getByRole("heading", { level: 1, name: /Foto bareng, walau/ })).toBeVisible()
  await page.goto("/r/ABCDEF")
  await expect(page.getByRole("heading", { name: "Kamu lagi offline" })).toBeVisible()
  await context.setOffline(false)
})

test("versi baru → toast update → muat ulang pakai versi baru", async ({ page }) => {
  await page.goto("/")
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)

  // Simulasikan deploy baru lewat proxy tes: sw.js berikutnya berversi baru.
  const bumped = await page.request.get("/__bump")
  test.skip(!bumped.ok(), "butuh tests/support/sw-bump-proxy.mjs")
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update())

  const toast = page.locator("[data-sonner-toast]", { hasText: "Versi baru tersedia" })
  await expect(toast).toBeVisible({ timeout: 15_000 })
  await Promise.all([page.waitForEvent("load"), toast.getByRole("button", { name: "Muat ulang" }).click()])

  const version = await page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        const ch = new MessageChannel()
        ch.port1.onmessage = (e) => resolve(e.data)
        navigator.serviceWorker.controller?.postMessage({ type: "GET_VERSION" }, [ch.port2])
      })
  )
  expect(version).toMatch(/-v\d+$/)
})
