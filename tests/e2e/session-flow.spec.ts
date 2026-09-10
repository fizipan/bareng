import { devices, expect, test, type Browser, type Page } from "@playwright/test"

// Alur M2 ke Supabase sungguhan: dua perangkat (host & tamu) di context
// terpisah, jadi masing-masing punya sesi anonim sendiri. Kamera masih simulasi.

// Profil Pixel tanpa `defaultBrowserType` (bukan opsi context).
const pixel: Partial<(typeof devices)["Pixel 7"]> = { ...devices["Pixel 7"] }
delete pixel.defaultBrowserType

async function newPhone(browser: Browser, baseURL: string | undefined) {
  const context = await browser.newContext({ ...pixel, baseURL })
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  const page = await context.newPage()
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  return { page, errors, close: () => context.close() }
}

async function allowCamera(page: Page) {
  await expect(page.getByRole("heading", { name: "Nyalakan kamera" })).toBeVisible({ timeout: 15_000 })
  await page.getByRole("button", { name: "Izinkan kamera" }).click()
  await expect(page.getByText("Begini nanti hasilnya")).toBeVisible()
}

const reviewHeading = (page: Page) => page.getByRole("heading", { name: "Empat foto, jadi." })

test("dua orang: buat room, gabung, foto serentak, ulang, hasil", async ({ browser, baseURL }) => {
  test.setTimeout(180_000)
  const host = await newPhone(browser, baseURL)
  const guest = await newPhone(browser, baseURL)

  // Host: satu klik dari landing sampai layar undang.
  await host.page.goto("/")
  await host.page.getByRole("button", { name: /Mulai foto bareng/ }).first().click()
  await expect(host.page).toHaveURL(/\/r\/[A-Z0-9]{6}$/, { timeout: 15_000 })
  await expect(host.page.getByRole("heading", { name: "Kirim link ini ke dia" })).toBeVisible()
  const code = host.page.url().split("/").pop()!

  // Tamu buka link → izin kamera; host otomatis pindah begitu tamu masuk.
  await guest.page.goto(`/r/${code}`)
  await allowCamera(guest.page)
  await allowCamera(host.page)

  // Nama panggilan host tampil di layar tamu.
  await host.page.getByRole("button", { name: /Ganti nama panggilan/ }).click()
  await host.page.getByRole("textbox", { name: "Nama panggilan" }).fill("Rara")
  await host.page.getByRole("button", { name: "Simpan" }).click()
  await expect(guest.page.getByText("Rara belum siap")).toBeVisible()

  await guest.page.getByRole("button", { name: /Ganti nama panggilan/ }).click()
  await guest.page.getByRole("textbox", { name: "Nama panggilan" }).fill("Dimas")
  await guest.page.getByRole("button", { name: "Simpan" }).click()
  await expect(host.page.getByText("Dimas belum siap")).toBeVisible()

  // Template & filter tersinkron ke dua layar.
  await host.page.getByRole("radio", { name: /Polaroid ganda/ }).click()
  await expect(guest.page.getByText("Rara ganti template ke Polaroid ganda")).toBeVisible()
  await guest.page.getByRole("radio", { name: /Y2K neon/ }).click()
  await expect(guest.page.getByRole("heading", { name: "Simpan tanpa watermark" })).toBeVisible()
  await guest.page.getByRole("button", { name: "Lanjut dengan watermark" }).click()

  // Dua-duanya siap → sesi foto mulai di dua layar.
  await host.page.getByRole("button", { name: "Siap!" }).click()
  await expect(guest.page.getByText("Rara siap")).toBeVisible()
  await guest.page.getByRole("button", { name: "Siap!" }).click()
  await expect(host.page.getByText(/Foto\s*1\s*dari 4/)).toBeVisible({ timeout: 10_000 })
  await expect(guest.page.getByText(/Foto\s*1\s*dari 4/)).toBeVisible({ timeout: 10_000 })

  // Hitung mundur sama di dua layar (dijadwalkan server).
  await expect(host.page.locator("span.animate-tick")).toBeVisible({ timeout: 10_000 })
  await expect(guest.page.locator("span.animate-tick")).toBeVisible({ timeout: 2_000 })

  await expect(reviewHeading(host.page)).toBeVisible({ timeout: 60_000 })
  await expect(reviewHeading(guest.page)).toBeVisible({ timeout: 10_000 })

  // Tamu minta ulang foto 2 → dua-duanya kembali ke foto 2.
  await guest.page.getByRole("button", { name: /^Foto 2/ }).click()
  await guest.page.getByRole("button", { name: "Ulang foto ini" }).click()
  await expect(host.page.getByText(/Foto\s*2\s*dari 4/)).toBeVisible({ timeout: 10_000 })
  await expect(host.page.getByText("Dimas minta ulang foto 2")).toBeVisible()
  // Lewati pose supaya lebih cepat.
  await host.page.getByRole("button", { name: "Ambil foto sekarang" }).click()
  await expect(reviewHeading(host.page)).toBeVisible({ timeout: 20_000 })
  await expect(reviewHeading(guest.page)).toBeVisible({ timeout: 10_000 })

  await host.page.getByRole("button", { name: "Jadikan photostrip" }).click()
  const done = "Jadi! Ini photostrip kalian."
  await expect(host.page.getByRole("heading", { name: done })).toBeVisible({ timeout: 10_000 })
  await expect(guest.page.getByRole("heading", { name: done })).toBeVisible({ timeout: 10_000 })

  // Orang ketiga ditolak.
  const third = await newPhone(browser, baseURL)
  await third.page.goto(`/r/${code}`)
  await expect(third.page.getByRole("heading", { name: "Room ini sudah penuh" })).toBeVisible({ timeout: 15_000 })
  await third.close()

  // Link hasil membuka halaman publik dengan nama berdua.
  await guest.page.getByRole("button", { name: "Salin link" }).click()
  const link = await guest.page.evaluate(() => navigator.clipboard.readText())
  expect(link).toMatch(/\/p\/[A-Za-z0-9]{10}$/)
  await guest.page.goto(new URL(link).pathname)
  await expect(guest.page.getByRole("heading", { name: "Rara & Dimas" })).toBeVisible()

  expect(host.errors).toEqual([])
  expect(guest.errors).toEqual([])
  await host.close()
  await guest.close()
})

test("kode yang tidak ada menampilkan error", async ({ page }) => {
  await page.goto("/gabung")
  const join = page.getByRole("button", { name: "Gabung ke room" })
  await expect(join).toBeDisabled()
  await page.getByLabel("Kode room").pressSequentially("zzzzzz")
  await expect(page).toHaveURL(/\/r\/ZZZZZZ$/)
  await expect(page.getByRole("heading", { name: "Room nggak ketemu" })).toBeVisible({ timeout: 15_000 })
})

test("kode tidak valid menampilkan error", async ({ page }) => {
  await page.goto("/r/abc")
  await expect(page.getByRole("heading", { name: "Room nggak ketemu" })).toBeVisible()
})

test("halaman legal & hasil yang tidak ada", async ({ page }) => {
  await page.goto("/privasi")
  await expect(page.getByRole("heading", { name: "Privasi" })).toBeVisible()
  await page.goto("/ketentuan")
  await expect(page.getByRole("heading", { name: "Ketentuan pakai" })).toBeVisible()
  const res = await page.goto("/p/tidakada00")
  expect(res?.status()).toBe(404)
})
