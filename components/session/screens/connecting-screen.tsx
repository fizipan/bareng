import { BoothLoader } from "@/components/art/booth-loader"

// Sambil join & menyambung channel: bilik photobooth mini yang "sibuk".
export function ConnectingScreen() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-5" role="status" aria-live="polite">
      <BoothLoader />
      <span className="text-small text-muted-foreground">Masuk ke booth…</span>
    </div>
  )
}
