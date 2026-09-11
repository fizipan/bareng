import { notFound } from "next/navigation"
import { AdminQueue, type QueueItem } from "@/app/(kertas)/admin/report-queue"
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

async function noop() {
  "use server"
}

// Pratinjau tampilan antrean /admin dengan data contoh (dev saja).
export default async function DevAdminPage({ searchParams }: PageProps<"/dev/admin">) {
  const { tab } = await searchParams
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_DEV_PAGES !== "1") notFound()
  return (
    <ModeRoot mode="kertas">
      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-5 pt-6 pb-12">
        <h1 className="font-display text-display-sm font-bold">Laporan</h1>
        <AdminQueue
          queue={SAMPLE}
          tab={tab === "selesai" ? "selesai" : "tinjau"}
          action={noop}
          now={NOW}
          hrefFor={(t) => (t === "tinjau" ? "/dev/admin" : "/dev/admin?tab=selesai")}
        />
      </main>
    </ModeRoot>
  )
}
