"use client"

import * as React from "react"
import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete"

import { cn } from "@/lib/utils"

const Autocomplete = AutocompletePrimitive.Root

function AutocompleteInput({
  className,
  ...props
}: React.ComponentProps<typeof AutocompletePrimitive.Input>) {
  return (
    <AutocompletePrimitive.Input
      data-slot="autocomplete-input"
      className={cn("input", className)}
      {...props}
    />
  )
}

function AutocompleteContent({
  className,
  children,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof AutocompletePrimitive.Popup> & { sideOffset?: number }) {
  return (
    <AutocompletePrimitive.Portal>
      <AutocompletePrimitive.Positioner
        sideOffset={sideOffset}
        align="start"
        className="isolate z-[100] w-(--anchor-width)"
      >
        <AutocompletePrimitive.Popup
          data-slot="autocomplete-content"
          className={cn(
            "max-h-72 w-(--anchor-width) overflow-y-auto rounded-[var(--radius)] border border-border bg-bg-card p-1 text-text shadow-[0_8px_30px_rgba(0,0,0,0.12)] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0",
            className
          )}
          {...props}
        >
          <AutocompletePrimitive.List>{children}</AutocompletePrimitive.List>
        </AutocompletePrimitive.Popup>
      </AutocompletePrimitive.Positioner>
    </AutocompletePrimitive.Portal>
  )
}

function AutocompleteItem({
  className,
  ...props
}: React.ComponentProps<typeof AutocompletePrimitive.Item>) {
  return (
    <AutocompletePrimitive.Item
      data-slot="autocomplete-item"
      className={cn(
        "relative flex cursor-pointer items-center rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[0.9rem] text-text-secondary outline-none select-none transition-colors data-highlighted:bg-bg-subtle data-highlighted:text-text",
        className
      )}
      {...props}
    />
  )
}

export { Autocomplete, AutocompleteInput, AutocompleteContent, AutocompleteItem }
