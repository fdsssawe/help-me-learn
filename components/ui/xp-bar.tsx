import * as React from "react"

import { cn } from "@/lib/utils"

// The single progress-bar primitive (replaces the 3 divergent bar styles).
// `value` is 0–100. Uses the `.xp-bar` / `.xp-bar-fill` design-system classes.
function XpBar({
  value,
  className,
  ...props
}: React.ComponentProps<"div"> & { value: number }) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div
      data-slot="xp-bar"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("xp-bar", className)}
      {...props}
    >
      <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

export { XpBar }
