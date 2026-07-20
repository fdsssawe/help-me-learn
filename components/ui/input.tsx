import * as React from "react"

import { cn } from "@/lib/utils"

// Wraps the `.input` design-system field. `error` toggles the `.input.error`
// (red border) state defined in globals.css.
function Input({
  className,
  error = false,
  ...props
}: React.ComponentProps<"input"> & { error?: boolean }) {
  return (
    <input data-slot="input" className={cn("input", error && "error", className)} {...props} />
  )
}

export { Input }
