import { notFound } from "next/navigation"
import type { FeedbackItem } from "@/app/(kertas)/admin/feedback-list"
import type { QueueItem } from "@/app/(kertas)/admin/report-queue"
import { AdminView, parseAdminParams } from "@/app/(kertas)/admin/admin-view"
import { ModeRoot } from "@/components/brand/mode-root"

export const metadata = { title: "Admin (contoh)", robots: { index: false } }

const NOW = Date.UTC(2026, 8, 11, 8, 0)
const SAMPLE: QueueItem[] = [
  {
    slug: "pfZ8iJzb7m",
    names: null,
    image_path: null,
    removed: false,
    taken_down: false,
    reports: 3,
    pending: 3,
    reasons: [
      { reason: "tanpa-izin", n: 2 },
      { reason: "lainnya", n: 1 },
    ],
    notes: [{ reason: "lainnya", note: "Ini foto teman saya, dia tidak tahu fotonya dibagikan." }],
    last_report: NOW - 5 * 60_000,
  },
  { slug: "Ab12Cd34Ef", names: "Rara & Dimas", image_path: null, removed: false, taken_down: false, reports: 1, pending: 0, reasons: [{ reason: "spam", n: 1 }], notes: [], last_report: NOW - 3 * 3_600_000 },
  { slug: "Zz98Yy76Xx", names: "Nisa & Bima", image_path: null, removed: true, taken_down: true, reports: 7, pending: 0, reasons: [{ reason: "seksual-kekerasan", n: 7 }], notes: [], last_report: NOW - 2 * 86_400_000 },
  { slug: "Qq11Ww22Ee", names: null, image_path: null, removed: true, taken_down: false, reports: 1, pending: 1, reasons: [{ reason: "tanpa-izin", n: 1 }], notes: [], last_report: NOW - 4 * 86_400_000 },
]

const FEEDBACK: FeedbackItem[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    kind: "bug",
    message: "Pas foto ke-3 video dia tiba-tiba freeze, terus hitung mundurnya jalan sendiri.",
    email: "rara@contoh.id",
    room_code: "FC8V6P",
    page: "/r/FC8V6P",
    user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
    meta: {
      browser: "Safari",
      browserVersion: "18.0",
      os: "iOS",
      osVersion: "18.0",
      device: "HP",
      screen: "390×844",
      viewport: "390×664",
      dpr: 3,
      touch: 5,
      language: "id-ID",
      timezone: "Asia/Jakarta",
      online: true,
      standalone: false,
      camera: "granted",
      microphone: "granted",
      sessionScreen: "capture",
      app: "a1b2c3d",
    },
    suspect: false,
    resolved: false,
    created_at: NOW - 12 * 60_000,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    kind: "masukan",
    message: "Tambahin template tema lebaran dong!",
    email: null,
    room_code: null,
    page: "/",
    user_agent: "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36 Instagram 350.0",
    meta: null,
    suspect: false,
    resolved: true,
    created_at: NOW - 26 * 3_600_000,
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    kind: "pertanyaan",
    message: "Hasil fotonya disimpan berapa lama ya? Mau saya unduh minggu depan.",
    email: "dimas@contoh.id",
    room_code: null,
    page: "/bantuan",
    user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/139.0.0.0 Safari/537.36",
    meta: {
      browser: "Chrome",
      browserVersion: "139.0.7258.66",
      os: "macOS",
      osVersion: "15.6.1",
      device: "Desktop",
      screen: "1512×982",
      viewport: "1440×820",
      dpr: 2,
      touch: 0,
      language: "id",
      timezone: "Asia/Makassar",
      online: true,
      connection: "4g",
      memory: 8,
      cores: 10,
      standalone: false,
      camera: "prompt",
      microphone: "prompt",
      app: "a1b2c3d",
    },
    suspect: true,
    resolved: false,
    created_at: NOW - 2 * 3_600_000,
  },
]

async function noop() {
  "use server"
}

// Pratinjau tampilan /admin dengan data contoh (dev saja).
export default async function DevAdminPage({ searchParams }: PageProps<"/dev/admin">) {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_DEV_PAGES !== "1") notFound()
  return (
    <ModeRoot mode="kertas">
      <AdminView
        params={parseAdminParams(await searchParams)}
        base="/dev/admin"
        queue={SAMPLE}
        feedback={FEEDBACK}
        error={null}
        now={NOW}
        actions={{ resolveReport: noop, resolveFeedback: noop, logout: noop }}
      />
    </ModeRoot>
  )
}
