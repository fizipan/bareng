import { expect, test } from "@playwright/test"

// Pusat bantuan & tombol bantuan melayang. /api/feedback di-mock supaya tes
// tidak mengisi tabel masukan.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/feedback", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' })
  )
})

test("pusat bantuan: isian dari link, kirim, tanda terima", async ({ page }) => {
  await page.goto("/bantuan?jenis=bug&room=ab12cd")
  await expect(page.getByRole("heading", { name: "Pusat bantuan", level: 1 })).toBeVisible()
  await expect(page.getByLabel(/Kode room/)).toHaveValue("AB12CD")
  await expect(page.locator("[data-help-fab]")).toHaveCount(0)

  const send = page.getByRole("button", { name: "Kirim", exact: true })
  await expect(send).toBeDisabled()
  await page.getByLabel(/^Ceritakan/).fill("Tombol unduh nggak jalan di HP saya")
  const request = page.waitForRequest("**/api/feedback")
  await send.click()
  expect((await request).postDataJSON()).toMatchObject({ kind: "bug", roomCode: "AB12CD", message: "Tombol unduh nggak jalan di HP saya" })
  await expect(page.getByText("Terima kasih, sudah kami terima")).toBeVisible()
})

test("tombol bantuan melayang: muncul setelah hero, buka modal form", async ({ page }) => {
  await page.goto("/")
  const fab = page.locator("[data-help-fab]")
  await expect(fab).toHaveAttribute("aria-hidden", "true")
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5))
  await expect(fab).not.toHaveAttribute("aria-hidden", "true")
  await fab.click()
  await expect(page.getByText("Butuh bantuan?")).toBeVisible()
  await page.getByLabel(/^Ceritakan/).fill("Tambahin template tema lebaran dong")
  await page.getByText("Masukan", { exact: true }).click()
  await page.getByRole("button", { name: "Kirim", exact: true }).click()
  await expect(page.getByText("Terima kasih, sudah kami terima")).toBeVisible()
})
