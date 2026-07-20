import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-bold tracking-[0.02em] whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-bg-subtle text-text-secondary",
        primary: "bg-primary-subtle text-primary",
        success: "bg-success-bg text-success",
        error: "bg-error-bg text-error",
        xp: "bg-xp-bg text-xp",
        gold: "bg-gold/12 text-gold",
        streak: "bg-streak/12 text-streak",
      },
      size: {
        sm: "px-2 py-0.5 text-[0.7rem]",
        default: "px-2.5 py-[3px] text-[0.78rem]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant, size, className }))} {...props} />
  )
}

export { Badge, badgeVariants }
