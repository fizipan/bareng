import { StatusPill } from "@/components/brand/status-pill"
import type { Conn } from "@/lib/session/types"

// Teks jujur & memberi arah (PRD §15.5).
export function connectionLabel(conn: Conn, attempt: number) {
  if (conn === "ok") return "Tersambung"
  if (conn === "lambat") return "Sinyal lagi lemot"
  return attempt > 0 ? `Terputus — mencoba lagi (${attempt}/3)` : "Putus, lagi disambungin"
}

export function ConnectionPill({ conn, attempt = 0 }: { conn: Conn; attempt?: number }) {
  return (
    <StatusPill tone={conn} role="status">
      {connectionLabel(conn, attempt)}
    </StatusPill>
  )
}
