import { statSync } from "node:fs"
import { devices, expect, test, type Browser, type Page } from "@playwright/test"

// Alur ke Supabase sungguhan: dua perangkat (host & tamu) di context terpisah,
// jadi masing-masing punya sesi anonim sendiri. Kamera = kamera palsu Chrome,
// video dua arah lewat WebRTC.

// Profil Pixel tanpa `defaultBrowserType` (bukan opsi context).
const pixel: Partial<(typeof devices)["Pixel 7"]> = { ...devices["Pixel 7"] }
delete pixel.defaultBrowserType

async function newPhone(browser: Browser, baseURL: string | undefined) {
  const context = await browser.newContext({ ...pixel, baseURL })
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  const page = await context.newPage()
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  return { page, context, errors, close: () => context.close() }
}

// Video benar-benar mengalir (bukan cuma elemen ada).
async function expectFeed(page: Page, feed: "local" | "remote") {
  await expect
    .poll(
      () =>
        page.evaluate((f) => {
          const v = document.querySelector<HTMLVideoElement>(`video[data-feed="${f}"]`)
          return !!v && v.readyState >= 2 && v.videoWidth > 0
        }, feed),
      { timeout: 30_000, message: `video ${feed} jalan` }
    )
    .toBe(true)
}

async function createRoom(page: Page) {
  await page.goto("/")
  await page.getByRole("button", { name: /Mulai foto bareng/ }).first().click()
  await expect(page).toHaveURL(/\/r\/[A-Z0-9]{6}$/, { timeout: 15_000 })
  await expect(page.getByRole("heading", { name: "Kirim link ini ke dia" })).toBeVisible()
  return page.url().split("/").pop()!
}

async function allowCamera(page: Page) {
  await expect(page.getByRole("heading", { name: "Nyalakan kamera" })).toBeVisible({ timeout: 15_000 })
  await page.getByRole("button", { name: "Izinkan kamera" }).click()
  // Longgar: dev server + dua tes berat berbarengan bisa lambat membuka kamera.
  await expect(page.getByText("Begini nanti hasilnya")).toBeVisible({ timeout: 20_000 })
}

const reviewHeading = (page: Page) => page.getByRole("heading", { name: "Empat foto, jadi." })

// Review berisi 8 foto asli (4 frame × kamu & dia) yang benar-benar termuat.
async function expectPhotos(page: Page) {
  await expect
    .poll(
      () => page.evaluate(() => [...document.querySelectorAll("main img")].filter((img) => (img as HTMLImageElement).naturalWidth > 0).length),
      { timeout: 30_000, message: "8 foto asli tampil" }
    )
    .toBeGreaterThanOrEqual(8)
}

test("dua orang: buat room, gabung, foto serentak, ulang, hasil", async ({ browser, baseURL }) => {
  test.setTimeout(240_000)
  const host = await newPhone(browser, baseURL)
  const guest = await newPhone(browser, baseURL)

  // Host: satu klik dari landing sampai layar undang.
  const code = await createRoom(host.page)

  // Tamu buka link → izin kamera; host otomatis pindah begitu tamu masuk.
  await guest.page.goto(`/r/${code}`)
  await allowCamera(guest.page)
  await allowCamera(host.page)

  // Video dua arah tersambung.
  for (const p of [host.page, guest.page]) {
    await expectFeed(p, "local")
    await expectFeed(p, "remote")
    await expect(p.getByText("Tersambung")).toBeVisible()
  }

  // Mic default mati; dinyalakan host lewat lembar izin → suaranya sampai ke
  // tamu, dan tile host di layar tamu menandai "Mic nyala".
  await expect(guest.page.getByRole("status").filter({ hasText: "Mic mati" })).toBeVisible()
  await host.page.getByRole("button", { name: "Nyalakan mikrofon" }).click()
  // Lembar penjelasan hanya muncul kalau browser belum pernah mengizinkan mic
  // (flag fake-ui menganggapnya sudah diizinkan).
  const allowMic = host.page.getByRole("button", { name: "Izinkan mikrofon" })
  await allowMic
    .waitFor({ timeout: 1500 })
    .then(() => allowMic.click())
    .catch(() => {})
  await expect(host.page.getByRole("button", { name: "Matikan mikrofon" })).toHaveAttribute("aria-pressed", "true")
  await expect(guest.page.getByRole("status").filter({ hasText: "Mic nyala" })).toBeVisible()
  await expect
    .poll(() =>
      guest.page.evaluate(() => {
        const stream = document.querySelector("audio")?.srcObject as MediaStream | null
        return stream?.getAudioTracks().length ?? 0
      })
    )
    .toBe(1)

  // Tamu muat ulang: izin sudah diingat, kamera nyala sendiri, video nyambung lagi.
  await guest.context.grantPermissions(["camera"])
  await guest.page.reload()
  await expect(guest.page.getByText("Begini nanti hasilnya")).toBeVisible({ timeout: 15_000 })
  await expectFeed(guest.page, "remote")
  await expectFeed(host.page, "remote")
  await expect(guest.page.getByRole("status").filter({ hasText: "Mic nyala" })).toBeVisible()

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

  // Slot aktif berisi video kamu & dia.
  await expectFeed(host.page, "local")
  await expectFeed(host.page, "remote")

  // Hitung mundur sama di dua layar (dijadwalkan server).
  await expect(host.page.locator("span.animate-tick")).toBeVisible({ timeout: 10_000 })
  await expect(guest.page.locator("span.animate-tick")).toBeVisible({ timeout: 2_000 })

  await expect(reviewHeading(host.page)).toBeVisible({ timeout: 60_000 })
  await expect(reviewHeading(guest.page)).toBeVisible({ timeout: 10_000 })
  await expectPhotos(host.page)
  await expectPhotos(guest.page)

  // Tamu minta ulang foto 2 → dua-duanya kembali ke foto 2.
  await guest.page.getByRole("button", { name: /^Foto 2/ }).click()
  await guest.page.getByRole("button", { name: "Ulang foto ini" }).click()
  await expect(host.page.getByText(/Foto\s*2\s*dari 4/)).toBeVisible({ timeout: 10_000 })
  await expect(host.page.getByText("Dimas minta ulang foto 2")).toBeVisible()
  // Lewati pose kalau masih sempat; kalau fase pose sudah lewat (jaringan
  // lambat), hitung mundur tetap jalan sendiri sesuai jadwal server.
  await host.page
    .getByRole("button", { name: "Ambil foto sekarang" })
    .click({ timeout: 2_000 })
    .catch(() => {})
  await expect(reviewHeading(host.page)).toBeVisible({ timeout: 20_000 })
  await expect(reviewHeading(guest.page)).toBeVisible({ timeout: 10_000 })
  await expectPhotos(host.page)
  await expectPhotos(guest.page)

  // Tombol aktif setelah 8 foto sampai di server.
  await host.page.getByRole("button", { name: "Jadikan photostrip" }).click({ timeout: 30_000 })
  const done = "Jadi! Ini photostrip kalian."
  await expect(host.page.getByRole("heading", { name: done })).toBeVisible({ timeout: 10_000 })
  await expect(guest.page.getByRole("heading", { name: done })).toBeVisible({ timeout: 10_000 })

  // Orang ketiga ditolak.
  const third = await newPhone(browser, baseURL)
  await third.page.goto(`/r/${code}`)
  await expect(third.page.getByRole("heading", { name: "Room ini sudah penuh" })).toBeVisible({ timeout: 15_000 })
  await third.close()

  // Unduh: file JPEG photostrip asli (Android = unduhan biasa).
  const [download] = await Promise.all([
    host.page.waitForEvent("download", { timeout: 30_000 }),
    host.page.getByRole("button", { name: "Unduh photostrip" }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/^bareng-[A-Za-z0-9]{10}\.jpg$/)
  expect(statSync(await download.path()).size).toBeGreaterThan(20_000)

  // Link hasil → halaman publik: nama berdua + photostrip asli dari Storage.
  await guest.page.getByRole("button", { name: "Salin link" }).click()
  const link = await guest.page.evaluate(() => navigator.clipboard.readText())
  expect(link).toMatch(/\/p\/[A-Za-z0-9]{10}$/)
  const publicPage = await guest.context.newPage()
  const stripSrc = async () => {
    await publicPage.goto(new URL(link).pathname)
    return publicPage.locator('img[src*="/object/public/results/"]').getAttribute("src", { timeout: 1_000 }).catch(() => null)
  }
  await expect.poll(stripSrc, { timeout: 40_000 }).toContain("/polaroid-none-free.jpg")
  await expect(publicPage.getByRole("heading", { name: "Rara & Dimas" })).toBeVisible()

  // Tombol unduh di halaman publik cuma untuk kalian berdua (tamu = peserta);
  // orang lain yang pegang link hanya bisa lihat & melaporkan.
  await expect(publicPage.getByRole("button", { name: "Unduh photostrip" })).toBeVisible({ timeout: 10_000 })
  const stranger = await newPhone(browser, baseURL)
  await stranger.page.goto(new URL(link).pathname)
  await expect(stranger.page.getByRole("heading", { name: "Rara & Dimas" })).toBeVisible()
  await stranger.page.waitForTimeout(1_500)
  await expect(stranger.page.getByRole("button", { name: "Unduh photostrip" })).toHaveCount(0)
  await stranger.page.getByRole("button", { name: "Laporkan halaman ini" }).click()
  await expect(stranger.page.getByRole("button", { name: "Kirim laporan" })).toBeDisabled()
  // "Lainnya" wajib pakai catatan.
  await stranger.page.getByLabel("Lainnya").check()
  await expect(stranger.page.getByRole("button", { name: "Kirim laporan" })).toBeDisabled()
  await stranger.page.getByLabel(/Catatan/).fill("Foto ini dipakai tanpa izin temanku")
  await stranger.page.getByRole("button", { name: "Kirim laporan" }).click()
  await expect(stranger.page.getByRole("heading", { name: "Terima kasih, laporan terkirim" })).toBeVisible()
  await stranger.page.getByRole("button", { name: "Tutup" }).click()
  await expect(stranger.page.getByRole("button", { name: "Sudah dilaporkan" })).toBeDisabled()
  expect(stranger.errors).toEqual([])
  await stranger.close()
  const strip = publicPage.locator('img[src*="/object/public/results/"]')
  await expect.poll(() => strip.evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBe(1080)
  const imageUrl = (await strip.getAttribute("src"))!

  // Pratinjau link (WhatsApp dll.): kartu JPEG hasil ini.
  const og = await publicPage.locator('meta[property="og:image"]').getAttribute("content")
  const ogUrl = new URL(og!)
  const ogRes = await publicPage.request.get(ogUrl.pathname + ogUrl.search)
  expect(ogRes.status()).toBe(200)
  expect(ogRes.headers()["content-type"]).toBe("image/jpeg")

  // Premium dari layar hasil → render ulang HD (2160 px) tanpa watermark.
  await host.page.getByRole("button", { name: /Lihat premium/ }).click()
  await host.page.getByRole("button", { name: /^Bayar/ }).click()
  await expect(host.page.getByText("Sesi premium aktif.", { exact: false })).toBeVisible({ timeout: 15_000 })
  await expect.poll(stripSrc, { timeout: 40_000 }).toContain("/polaroid-none-premium.jpg")
  await expect.poll(() => strip.evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBe(2160)

  // Ganti template di layar hasil → photostrip dirender & diunggah ulang.
  await host.page.getByRole("radio", { name: /Grid kotak/ }).click()
  await expect.poll(stripSrc, { timeout: 40_000 }).toContain("/kotak-none-premium.jpg")

  // Hapus: link mati, file dibuang dari Storage, layar dia ikut tahu.
  await host.page.getByRole("button", { name: "Hapus foto ini" }).click()
  await host.page.getByRole("button", { name: "Hapus foto" }).click()
  await expect(host.page).toHaveURL(/\/$/)
  await expect(guest.page.getByRole("heading", { name: "Photostrip ini sudah dihapus" })).toBeVisible()
  const gone = await publicPage.goto(new URL(link).pathname)
  expect(gone?.status()).toBe(404)
  await expect
    .poll(async () => (await publicPage.request.get(`${imageUrl}?t=${Date.now()}`)).status(), { timeout: 20_000 })
    .not.toBe(200)

  expect(host.errors).toEqual([])
  expect(guest.errors).toEqual([])
  await host.close()
  await guest.close()
})

test("pasangan putus: coba lagi 3×, lalu nyambung sendiri saat dia kembali", async ({ browser, baseURL }) => {
  test.setTimeout(150_000)
  const host = await newPhone(browser, baseURL)
  const guest = await newPhone(browser, baseURL)
  const code = await createRoom(host.page)
  await guest.page.goto(`/r/${code}`)
  await allowCamera(guest.page)
  await allowCamera(host.page)
  await expectFeed(host.page, "remote")

  // Tamu menutup tab tanpa pamit.
  await guest.context.grantPermissions(["camera"])
  await guest.page.close()
  await expect(host.page.getByText(/Terputus — mencoba lagi \(\d\/3\)|Putus, lagi disambungin/)).toBeVisible({
    timeout: 15_000,
  })
  await expect(host.page.getByRole("heading", { name: "Sambungan dia putus" })).toBeVisible({ timeout: 60_000 })

  // Tamu kembali lewat link yang sama → host tersambung lagi tanpa klik apa pun.
  const back = await guest.context.newPage()
  await back.goto(`/r/${code}`)
  await expect(back.getByText("Begini nanti hasilnya")).toBeVisible({ timeout: 15_000 })
  await expect(host.page.getByText("Begini nanti hasilnya")).toBeVisible({ timeout: 20_000 })
  await expectFeed(host.page, "remote")
  await expectFeed(back, "remote")

  expect(host.errors).toEqual([])
  await host.close()
  await guest.close()
})

test("putus di tengah sesi foto: foto yang terlewat diulang berdua", async ({ browser, baseURL }) => {
  test.setTimeout(180_000)
  const host = await newPhone(browser, baseURL)
  const guest = await newPhone(browser, baseURL)
  const code = await createRoom(host.page)
  await guest.page.goto(`/r/${code}`)
  await allowCamera(guest.page)
  await allowCamera(host.page)
  await guest.context.grantPermissions(["camera"])

  await host.page.getByRole("button", { name: "Siap!" }).click()
  await guest.page.getByRole("button", { name: "Siap!" }).click()
  // Foto 1 beres, lalu tamu menutup tab saat foto 2; host motret sendirian.
  await expect(guest.page.getByText(/Foto\s*2\s*dari 4/)).toBeVisible({ timeout: 20_000 })
  await guest.page.close()
  await host.page.waitForTimeout(8_000)

  // Tamu kembali: foto 2 diulang berdua, sesi lanjut sampai review. Foto yang
  // sempat diambil tapi belum terunggah saat tab ditutup ikut diulang otomatis.
  const back = await guest.context.newPage()
  await back.goto(`/r/${code}`)
  await expect(reviewHeading(host.page)).toBeVisible({ timeout: 90_000 })
  await expect(host.page.getByRole("button", { name: "Jadikan photostrip" })).toBeEnabled({ timeout: 90_000 })
  await expect(reviewHeading(back)).toBeVisible({ timeout: 10_000 })
  await expectPhotos(host.page)
  await expectPhotos(back)

  expect(host.errors).toEqual([])
  await host.close()
  await guest.close()
})

test("kamera ditolak: panduan per browser", async ({ browser, baseURL }) => {
  const host = await newPhone(browser, baseURL)
  const guest = await newPhone(browser, baseURL)
  await guest.context.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("Ditolak", "NotAllowedError"))
  })

  const code = await createRoom(host.page)
  await guest.page.goto(`/r/${code}`)
  await expect(guest.page.getByRole("heading", { name: "Nyalakan kamera" })).toBeVisible({ timeout: 15_000 })
  await guest.page.getByRole("button", { name: "Izinkan kamera" }).click()
  await expect(guest.page.getByRole("heading", { name: "Kamera belum diizinkan" })).toBeVisible()

  await guest.page.getByRole("button", { name: "Cara mengaktifkan" }).click()
  await expect(guest.page.getByRole("heading", { name: "Cara menyalakan kamera" })).toBeVisible()
  await expect(guest.page.getByText("Chrome di Android")).toBeVisible()
  await guest.page.getByRole("button", { name: "Sudah, coba lagi" }).click()
  await expect(guest.page.getByRole("heading", { name: "Kamera belum diizinkan" })).toBeVisible()

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
  await expect(page.getByRole("heading", { name: "Photostrip ini sudah nggak ada" })).toBeVisible()
  const lost = await page.goto("/halaman-yang-tidak-ada")
  expect(lost?.status()).toBe(404)
  await expect(page.getByRole("heading", { name: "Halaman ini nggak ada" })).toBeVisible()
})
