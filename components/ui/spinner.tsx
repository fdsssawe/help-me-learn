import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

// The single spinner (replaces the duplicated inline copies).
function Spinner({ className, size = 24 }: { className?: string; size?: number }) {
  return <Loader2 size={size} className={cn("animate-spin text-primary", className)} aria-hidden="true" />
}

export { Spinner }
