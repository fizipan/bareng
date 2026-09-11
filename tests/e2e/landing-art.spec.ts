import { expect, test } from "@playwright/test"

// Ilustrasi interaktif landing: tombol jepret di hero memutar hitung mundur
// lalu mencetak strip baru; dengan reduced motion langsung berganti tanpa gerak.
test("hero: coba jepret → hitung mundur → cetakan baru", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await page.goto("/")
  const shutter = page.getByRole("button", { name: /Coba jepret/ })
  await shutter.click()
  await expect(page.locator("span.animate-count")).toHaveText("3")
  await expect(shutter).toBeDisabled()
  await expect(page.locator("span.animate-count")).toHaveText("1", { timeout: 3_000 })
  await expect(shutter).toBeEnabled({ timeout: 3_000 })
  expect(errors).toEqual([])
})

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" })

  test("tanpa hitung mundur & adegan tidak diputar otomatis", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: /Coba jepret/ }).click()
    await expect(page.locator("span.animate-count")).toHaveCount(0)
    await page.locator("#cara-kerja").scrollIntoViewIfNeeded()
    // Kartu langkah menampilkan gambar diam (tidak ada yang disorot).
    await expect(page.locator("#cara-kerja li.outline-shutter")).toHaveCount(0)
  })
})
