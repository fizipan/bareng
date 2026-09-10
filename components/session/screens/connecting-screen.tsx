import { LogoMark } from "@/components/brand/logo"

export function ConnectingScreen() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5" role="status" aria-live="polite">
      <LogoMark size={48} className="animate-blink" />
      <span className="text-small text-muted-foreground">Masuk ke booth…</span>
    </div>
  )
}
