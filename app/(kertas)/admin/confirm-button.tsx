"use client"

import { Button } from "@/components/ui/button"

// Tombol submit dengan konfirmasi (menurunkan photostrip tidak bisa dibatalkan).
export function ConfirmButton({ message, children, ...props }: React.ComponentProps<typeof Button> & { message: string }) {
  return (
    <Button
      {...props}
      type="submit"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault()
      }}
    >
      {children}
    </Button>
  )
}
