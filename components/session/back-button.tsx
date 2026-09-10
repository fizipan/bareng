import { ChevronLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function BackButton({
  label = "Kembali",
  onClick,
  size = "icon",
  className,
}: {
  label?: string
  onClick: () => void
  size?: "icon" | "icon-sm"
  className?: string
}) {
  return (
    <Button variant="soft" size={size} aria-label={label} onClick={onClick} className={cn("shrink-0", className)}>
      <ChevronLeftIcon className="size-5" />
    </Button>
  )
}
