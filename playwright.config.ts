import { defineConfig, devices } from "@playwright/test"

// E2E memakai Chrome yang sudah terpasang (channel "chrome"), jadi tidak perlu
// mengunduh browser. BASE_URL bisa diarahkan ke preview Vercel.
const baseURL = process.env.BASE_URL ?? "http://localhost:3000"

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  // Tiap tes sesi = 2–3 HP dengan kamera palsu + WebRTC + encode foto; lebih
  // dari 2 sekaligus membuat CPU jenuh dan timing capture ikut melambat.
  workers: 2,
  reporter: [["list"]],
  use: {
    baseURL,
    channel: "chrome",
    trace: "retain-on-failure",
    launchOptions: {
      // Kamera palsu untuk M3+: izin otomatis, feed dari pola uji Chrome.
      args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
    },
  },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"], channel: "chrome" } }],
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: true,
  },
})
