import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Varian tombol PRD §15.5. `primary` hanya satu per layar.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2.5 rounded-md border border-transparent font-semibold whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-shutter-hover disabled:bg-grain/40 disabled:text-kertas/70 dark:disabled:bg-darkroom-2 dark:disabled:text-[#5C5870]",
        secondary:
          "border-[1.5px] border-outline bg-transparent text-foreground hover:bg-foreground/5 disabled:opacity-40",
        soft: "bg-card text-card-foreground hover:bg-card/80 disabled:opacity-40",
        // Tombol terang di atas kartu gelap (kartu premium di layar hasil).
        paper: "bg-kertas text-darkroom hover:bg-white disabled:opacity-40",
        ghost:
          "bg-transparent font-medium text-muted-foreground hover:text-foreground disabled:opacity-40",
        link: "bg-transparent px-0 text-link underline-offset-4 hover:underline disabled:opacity-40",
        shutter:
          "rounded-full bg-primary outline-3 outline-offset-4 outline-kertas outline-solid hover:bg-shutter-hover focus-visible:ring-0 focus-visible:outline-flash disabled:opacity-40",
      },
      size: {
        default: "h-12 px-5 text-body",
        sm: "h-11 px-4 text-small",
        lg: "h-15 px-[18px] text-body",
        inline: "h-auto min-h-11 text-small",
        icon: "size-10 rounded-full",
        "icon-sm": "size-9 rounded-full",
        shutter: "size-20",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
