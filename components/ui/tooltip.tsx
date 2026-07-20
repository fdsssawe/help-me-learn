"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

// Convenience tooltip: wrap a single trigger element, pass the label text.
//   <Tooltip label="Edit"><Button size="icon">…</Button></Tooltip>
function Tooltip({
  label,
  children,
  side = "top",
  className,
}: {
  label: React.ReactNode
  children: React.ReactElement
  side?: "top" | "right" | "bottom" | "left"
  className?: string
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger render={children} />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner side={side} sideOffset={6} className="z-[200]">
          <TooltipPrimitive.Popup
            data-slot="tooltip"
            className={cn(
              "rounded-[var(--radius-sm)] bg-text px-2 py-1 text-[0.74rem] font-semibold text-bg shadow-[var(--shadow-md)]",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0",
              className
            )}
          >
            {label}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

export { Tooltip, TooltipProvider }
