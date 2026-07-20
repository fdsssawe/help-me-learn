import * as React from "react"

import { cn } from "@/lib/utils"
import { getLevel } from "@/lib/levels"

// A level pill coloured by the level's own accent (data-driven, so the colour is
// a legitimate inline style). Pass the user's total `xp`.
function LevelBadge({
  xp,
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "style"> & { xp: number }) {
  const level = getLevel(xp)
  return (
    <span
      data-slot="level-badge"
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[0.78rem] font-bold tracking-[0.02em]",
        className
      )}
      style={{ backgroundColor: `${level.color}1F`, color: level.color }}
      {...props}
    >
      {level.name}
    </span>
  )
}

export { LevelBadge }
