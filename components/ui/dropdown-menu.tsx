"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"

import { cn } from "@/lib/utils"

const DropdownMenu = MenuPrimitive.Root
const DropdownMenuTrigger = MenuPrimitive.Trigger
const DropdownMenuGroup = MenuPrimitive.Group

function DropdownMenuContent({
  className,
  sideOffset = 8,
  align = "end",
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Popup> &
  Pick<React.ComponentProps<typeof MenuPrimitive.Positioner>, "align" | "side" | "sideOffset">) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        align={align}
        sideOffset={sideOffset}
        className="isolate z-[100] outline-none"
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "min-w-[200px] origin-(--transform-origin) rounded-[var(--radius)] border border-border bg-bg-card p-1.5 text-text shadow-[0_8px_30px_rgba(0,0,0,0.12)] outline-none",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function DropdownMenuItem({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Item> & { variant?: "default" | "destructive" }) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-[0.9rem] font-semibold outline-none transition-colors select-none",
        variant === "destructive"
          ? "text-error data-highlighted:bg-error-bg"
          : "text-text-secondary data-highlighted:bg-bg-subtle data-highlighted:text-text",
        "[&_svg]:size-3.5 [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuLinkItem({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.LinkItem>) {
  return (
    <MenuPrimitive.LinkItem
      data-slot="dropdown-menu-link-item"
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-[0.9rem] font-semibold text-text-secondary no-underline outline-none transition-colors select-none data-highlighted:bg-bg-subtle data-highlighted:text-text [&_svg]:size-3.5 [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
}

// A plain (non-interactive) section heading. Not MenuPrimitive.GroupLabel — that
// requires a surrounding <Menu.Group>; this label stands alone in the popup.
function DropdownMenuLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-label"
      className={cn(
        "px-3 pb-1.5 pt-1 text-[0.68rem] font-bold uppercase tracking-[0.06em] text-text-muted",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div role="separator" className={cn("my-1.5 h-px bg-border", className)} />
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
}
