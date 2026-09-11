import { devices, expect, test, type Page } from "@playwright/test"

// Bottom sheet pasang aplikasi. Prompt Chromium disimulasikan dengan event
// `beforeinstallprompt` buatan (konteks tes incognito tidak pernah memicunya).
async function fakeInstallPrompt(page: Page, outcome: "accepted" | "dismissed" = "accepted") {
  await page.waitForLoadState("networkidle")
  await page.evaluate((result) => {
    const e = new Event("beforeinstallprompt", { cancelable: true })
    Object.assign(e, {
      prompt: async () => {
        ;(window as unknown as { __prompted: boolean }).__prompted = true
      },
      userChoice: Promise.resolve({ outcome: result }),
    })
    window.dispatchEvent(e)
  }, outcome)
}

const nudgeOf = (page: Page) => page.getByRole("complementary", { name: "Pasang aplikasi" })

test("android: ajakan baru muncul setelah menggulir → sheet → prompt bawaan", async ({ page }) => {
  await page.goto("/")
  await fakeInstallPrompt(page)
  // Tidak langsung muncul begitu halaman dibuka.
  await page.waitForTimeout(1500)
  await expect(nudgeOf(page)).toHaveCount(0)
  await page.locator("#template").scrollIntoViewIfNeeded()
  await expect(nudgeOf(page)).toBeVisible({ timeout: 6_000 })

  await nudgeOf(page).getByRole("button", { name: "Pasang", exact: true }).click()
  const sheet = page.getByRole("dialog")
  await expect(sheet.getByText("Pasang aplikasi Bareng")).toBeVisible()
  await expect(sheet.getByRole("img")).toHaveCount(4)
  await expect(sheet.getByText("Buka langsung dari layar utama", { exact: false })).toBeVisible()

  await sheet.getByRole("button", { name: "Pasang aplikasi" }).click()
  await expect.poll(() => page.evaluate(() => (window as unknown as { __prompted?: boolean }).__prompted)).toBe(true)
  await expect(sheet).toBeHidden()
  await expect(nudgeOf(page)).toHaveCount(0)
})

test("tutup ajakan → ditunda 14 hari", async ({ page }) => {
  await page.goto("/")
  await fakeInstallPrompt(page)
  await page.locator("#template").scrollIntoViewIfNeeded()
  await nudgeOf(page).getByRole("button", { name: "Nanti saja" }).click()
  await expect(nudgeOf(page)).toHaveCount(0)
  const until = await page.evaluate(() => Number(localStorage.getItem("bareng:install-snoozed-until")))
  expect(until - Date.now()).toBeGreaterThan(13 * 86_400_000)
})

test("link footer → sheet → nanti aja → ditunda", async ({ page }) => {
  await page.goto("/")
  await fakeInstallPrompt(page)
  await page.getByRole("contentinfo").getByRole("button", { name: "Pasang aplikasi" }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Nanti aja" }).click()
  await expect(page.getByRole("dialog")).toBeHidden()
  const until = await page.evaluate(() => Number(localStorage.getItem("bareng:install-snoozed-until")))
  expect(until - Date.now()).toBeGreaterThan(13 * 86_400_000)
})

// Profil iPhone tanpa `defaultBrowserType` (tidak boleh diubah di dalam describe).
const iphone: Partial<(typeof devices)["iPhone 13"]> = { ...devices["iPhone 13"] }
delete iphone.defaultBrowserType

test.describe("iPhone", () => {
  test.use(iphone)

  test("ajakan → langkah Tambah ke Layar Utama", async ({ page }) => {
    await page.goto("/")
    await page.locator("#template").scrollIntoViewIfNeeded()
    await nudgeOf(page).getByRole("button", { name: "Pasang", exact: true }).click()
    const sheet = page.getByRole("dialog")
    await expect(sheet.getByText("Pasang Bareng di iPhone")).toBeVisible()
    await expect(sheet.getByText("Tambah ke Layar Utama", { exact: false })).toBeVisible()
    await sheet.getByRole("button", { name: "Oke, paham" }).click()
    await expect(sheet).toBeHidden()
  })

  test("sheet terbuka sendiri di layar hasil sesi", async ({ page }) => {
    test.skip(!!process.env.PWA || !!process.env.BASE_URL, "halaman /dev tidak ada di production")
    await page.goto("/dev/screens")
    await page.getByRole("button", { name: /8 · Hasil/ }).click()
    await expect(page.getByText("Pasang Bareng di iPhone")).toBeVisible({ timeout: 6_000 })
  })
})
