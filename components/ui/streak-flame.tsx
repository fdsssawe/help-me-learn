import * as React from "react"
import { Flame } from "lucide-react"

import { cn } from "@/lib/utils"

// Compact streak indicator (flame + count). Greys out at 0 so a broken/absent
// streak reads differently from an active one.
function StreakFlame({
  count,
  className,
  iconSize = 15,
  ...props
}: React.ComponentProps<"span"> & { count: number; iconSize?: number }) {
  const active = count > 0
  return (
    <span
      data-slot="streak-flame"
      className={cn(
        "inline-flex items-center gap-1 font-bold tabular-nums",
        active ? "text-streak" : "text-text-muted",
        className
      )}
      {...props}
    >
      <Flame size={iconSize} strokeWidth={2.4} className={active ? "fill-streak/20" : ""} />
      {count}
    </span>
  )
}

export { StreakFlame }
