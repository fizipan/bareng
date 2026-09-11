import { notFound } from "next/navigation"
import { ReportQueue, type QueueItem } from "@/app/(kertas)/admin/report-queue"
import { ModeRoot } from "@/components/brand/mode-root"

export const metadata = { title: "Admin (contoh)", robots: { index: false } }

const NOW = Date.UTC(2026, 8, 11, 8, 0)
const SAMPLE: QueueItem[] = [
  { slug: "pfZ8iJzb7m", names: null, image_path: null, removed: false, reports: 3, pending: 3, reasons: ["tanpa-izin", "spam"], last_report: NOW - 5 * 60_000 },
  { slug: "Ab12Cd34Ef", names: "Rara & Dimas", image_path: null, removed: false, reports: 1, pending: 0, reasons: ["lainnya"], last_report: NOW - 3 * 3_600_000 },
  { slug: "Zz98Yy76Xx", names: "Nisa & Bima", image_path: null, removed: true, reports: 7, pending: 0, reasons: ["seksual-kekerasan"], last_report: NOW - 2 * 86_400_000 },
]

async function noop() {
  "use server"
}

// Pratinjau tampilan antrean /admin dengan data contoh (dev saja).
export default function DevAdminPage() {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_DEV_PAGES !== "1") notFound()
  return (
    <ModeRoot mode="kertas">
      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-5 pt-6 pb-12">
        <h1 className="font-display text-display-sm font-bold">Laporan</h1>
        <ReportQueue queue={SAMPLE} action={noop} now={NOW} />
      </main>
    </ModeRoot>
  )
}
