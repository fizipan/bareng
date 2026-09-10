import { expect, test, type Page } from "@playwright/test"

// Alur M1 (pasangan & kamera masih simulasi): semua layar tersambung benar.

async function shootUntilReview(page: Page) {
  const review = page.getByRole("heading", { name: "Empat foto, jadi." })
  const shutter = page.getByRole("button", { name: "Ambil foto sekarang" })
  while (!(await review.isVisible())) {
    if (await shutter.isVisible()) await shutter.click().catch(() => {})
    await page.waitForTimeout(250)
  }
}

test("host: landing sampai hasil premium", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))

  await page.goto("/")
  await page.getByRole("button", { name: /Mulai foto bareng/ }).first().click()
  await expect(page).toHaveURL(/\/r\/[A-Z0-9]{6}$/)
  await expect(page.getByRole("heading", { name: "Kirim link ini ke dia" })).toBeVisible()

  // Pasangan simulasi masuk ~3,6 dtk lalu layar pindah ke izin kamera.
  await expect(page.getByRole("heading", { name: "Nyalakan kamera" })).toBeVisible({ timeout: 10_000 })
  await page.getByRole("button", { name: "Izinkan kamera" }).click()
  await expect(page.getByText("Begini nanti hasilnya")).toBeVisible()

  // Template gratis langsung terpasang, premium membuka paywall.
  await page.getByRole("radio", { name: /Polaroid ganda/ }).click()
  await expect(page.getByText("Polaroid ganda").first()).toBeVisible()
  await page.getByRole("radio", { name: /Y2K neon/ }).click()
  await expect(page.getByRole("heading", { name: "Simpan tanpa watermark" })).toBeVisible()
  await page.getByRole("button", { name: "Lanjut dengan watermark" }).click()

  await page.getByRole("button", { name: "Siap!" }).click()
  await expect(page.getByText(/Foto\s*1\s*dari 4/)).toBeVisible({ timeout: 10_000 })
  await shootUntilReview(page)

  // Ulang satu foto.
  await page.getByRole("button", { name: /^Foto 2/ }).click()
  await page.getByRole("button", { name: "Ulang foto ini" }).click()
  await expect(page.getByText(/Foto\s*2\s*dari 4/)).toBeVisible()
  await shootUntilReview(page)

  await page.getByRole("button", { name: "Jadikan photostrip" }).click()
  await expect(page.getByRole("heading", { name: "Jadi! Ini photostrip kalian." })).toBeVisible()

  await page.getByRole("button", { name: /Lihat premium/ }).click()
  await page.getByRole("button", { name: "Bayar Rp15.000" }).click()
  await expect(page.getByText("Sesi premium aktif.", { exact: false })).toBeVisible({ timeout: 10_000 })

  expect(errors).toEqual([])
})

test("tamu: gabung pakai kode", async ({ page }) => {
  await page.goto("/gabung")
  const join = page.getByRole("button", { name: "Gabung ke room" })
  await expect(join).toBeDisabled()
  await page.getByLabel("Kode room").pressSequentially("k7m2qx")
  await expect(page).toHaveURL(/\/r\/K7M2QX$/)
  await expect(page.getByRole("heading", { name: "Nyalakan kamera" })).toBeVisible()
})

test("kode tidak valid menampilkan error", async ({ page }) => {
  await page.goto("/r/abc")
  await expect(page.getByRole("heading", { name: "Room nggak ketemu" })).toBeVisible()
})

test("halaman publik & legal", async ({ page }) => {
  await page.goto("/p/contoh")
  await expect(page.getByRole("heading", { name: "Rara & Dimas" })).toBeVisible()
  await page.goto("/privasi")
  await expect(page.getByRole("heading", { name: "Privasi" })).toBeVisible()
  await page.goto("/ketentuan")
  await expect(page.getByRole("heading", { name: "Ketentuan pakai" })).toBeVisible()
  const res = await page.goto("/p/tidak-ada")
  expect(res?.status()).toBe(404)
})
