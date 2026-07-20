import * as React from "react"

import { cn } from "@/lib/utils"

// Form field label. Pair with an input's `id` via `htmlFor` for accessibility.
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn("mb-1 block text-[0.82rem] font-semibold text-text-secondary", className)}
      {...props}
    />
  )
}

export { Label }
