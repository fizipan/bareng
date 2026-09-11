import { expect, test } from "@playwright/test"

// Halaman /demo. RPC-nya dipalsukan lewat route mock supaya tes tidak
// menambah permintaan sungguhan di admin.
test("minta akses demo untuk perangkat ini", async ({ page }) => {
  await page.route("**/api/demo-request", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true,"status":"pending"}' })
  )
  await page.goto("/demo")
  await expect(page.getByRole("heading", { name: "Mau pakai Bareng buat demo?" })).toBeVisible()

  await page.getByLabel("Nama kamu").fill("Rara")
  await page.getByLabel(/WhatsApp atau email/).fill("rara@contoh.id")
  await page.getByLabel(/Buat apa/).fill("Demo ke calon klien")
  const request = page.waitForRequest("**/api/demo-request")
  await page.getByRole("button", { name: "Kirim permintaan" }).click()

  const body = (await request).postDataJSON()
  expect(body).toMatchObject({ name: "Rara", contact: "rara@contoh.id", note: "Demo ke calon klien" })
  // Info perangkat ikut terkirim supaya admin tahu ini HP apa.
  expect(body.meta.browser).toBeTruthy()
  await expect(page.getByText("Permintaan sudah masuk")).toBeVisible()
})
