import * as React from "react"

import { cn } from "@/lib/utils"

// Wraps the `.card` / `.card-elevated` design-system surfaces as a component so
// consumers stop hand-writing the class string. `elevated` = larger radius + md shadow.
function Card({
  className,
  elevated = false,
  ...props
}: React.ComponentProps<"div"> & { elevated?: boolean }) {
  return (
    <div
      data-slot="card"
      className={cn(elevated ? "card-elevated" : "card", className)}
      {...props}
    />
  )
}

export { Card }
