import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-sm font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-fg hover:bg-primary-hover hover:-translate-y-px hover:shadow-[var(--shadow-sm)] active:translate-y-0",
        secondary:
          "bg-bg-subtle text-text border border-border hover:bg-bg-hover hover:border-border-strong",
        ghost: "text-text-secondary hover:bg-bg-subtle hover:text-text",
        success:
          "bg-success text-white hover:opacity-90 hover:-translate-y-px active:translate-y-0",
        destructive:
          "bg-error text-white hover:opacity-90 hover:-translate-y-px active:translate-y-0",
      },
      size: {
        default: "px-5 py-2.5",
        sm: "px-3 py-1.5 text-[0.85rem]",
        lg: "px-7 py-3.5 text-[1.05rem] rounded-[var(--radius)]",
        icon: "p-2",
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
