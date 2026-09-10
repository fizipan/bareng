"use client"

import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { cn } from "@/lib/utils"

export const ROOM_CODE_LENGTH = 6

// Input kode room PRD §15.5: 6 kotak, Bricolage display-md, auto-advance,
// huruf besar otomatis, paste satu kode langsung terisi.
export function RoomCodeInput({
  id = "room-code",
  value,
  onChange,
  onComplete,
  autoFocus,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  autoFocus?: boolean
}) {
  return (
    <InputOTP
      id={id}
      maxLength={ROOM_CODE_LENGTH}
      value={value}
      onChange={(v) => onChange(v.toUpperCase())}
      onComplete={(v: string) => onComplete?.(v.toUpperCase())}
      pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
      inputMode="text"
      autoCapitalize="characters"
      autoComplete="off"
      autoFocus={autoFocus}
      aria-label="Kode room"
      containerClassName="w-full"
    >
      <InputOTPGroup className="w-full justify-between gap-[7px]">
        {Array.from({ length: ROOM_CODE_LENGTH }, (_, i) => (
          <InputOTPSlot
            key={i}
            index={i}
            className={cn(
              "h-15 w-12 rounded-sm border-[1.5px] bg-card font-display text-[26px] font-semibold text-foreground uppercase first:rounded-sm first:border-l-[1.5px] last:rounded-sm data-[active=true]:border-shutter",
              value[i] ? "border-shutter" : "border-outline"
            )}
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
}
