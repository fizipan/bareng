"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckIcon, TriangleAlertIcon } from "lucide-react"

// Toast PRD §15.5: bawah tengah, darkroom-2 di Kabin / darkroom di Kertas
// (lewat token --toast), radius r-md, ikon + teks small, 3 detik.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="bottom-center"
      duration={3000}
      offset={28}
      mobileOffset={{ bottom: "calc(20px + env(safe-area-inset-bottom))", left: 16, right: 16 }}
      gap={8}
      icons={{
        success: (
          <span className="flex size-5 items-center justify-center rounded-full bg-ok text-kertas">
            <CheckIcon className="size-3" strokeWidth={3} />
          </span>
        ),
        error: (
          <span className="flex size-5 items-center justify-center rounded-full bg-shutter text-kertas">
            <TriangleAlertIcon className="size-3" strokeWidth={2.5} />
          </span>
        ),
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "inset-x-0 mx-auto flex w-max max-w-full font-sans items-center gap-2.5 rounded-md bg-toast py-[11px] pr-4 pl-3 text-small text-kertas shadow-toast",
          icon: "flex shrink-0 items-center self-start pt-px",
          content: "flex min-w-0 flex-col gap-0.5",
          title: "font-normal",
          description: "text-caption text-kertas/70",
          actionButton:
            "ml-1 shrink-0 rounded-sm bg-shutter px-3 py-1.5 text-caption font-semibold text-kertas hover:bg-shutter-hover",
          cancelButton: "shrink-0 rounded-sm px-2 py-1.5 text-caption text-kertas/70 hover:text-kertas",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
