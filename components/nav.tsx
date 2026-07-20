"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTransition } from "react"
import { LayoutDashboard, BookOpen, Zap, LogOut } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { StreakFlame } from "@/components/ui/streak-flame"
import { LevelBadge } from "@/components/ui/level-badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { signOut } from "@/app/actions/auth"
import { setNativeLang } from "@/app/actions/user"
import { TARGET_LANGUAGES } from "@/lib/enrichment/languages"

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/vocabulary", label: "Vocabulary", Icon: BookOpen },
  { href: "/quiz", label: "Quiz", Icon: Zap },
]

type NavUser = {
  name: string | null
  email: string | null
  image: string | null
  nativeLang: string
  plan: string
  xp: number
  streak: number
}

export function Nav({ user }: { user: NavUser }) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const initial = user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "?"
  const displayName = user.name ?? user.email?.split("@")[0] ?? "Account"

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg-card shadow-sm">
      <div className="mx-auto flex h-[60px] max-w-[1100px] items-center justify-between gap-2 px-4 sm:px-6">
        <Link
          href="/dashboard"
          className="shrink-0 font-display text-[1.35rem] font-bold tracking-tight text-primary no-underline"
        >
          Lexora
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-1">
          {NAV_LINKS.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[0.9rem] no-underline transition-all sm:px-3.5 ${
                  active
                    ? "bg-primary-subtle font-bold text-primary"
                    : "font-medium text-text-secondary hover:bg-bg-subtle hover:text-text"
                }`}
              >
                <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <StreakFlame count={user.streak} className="hidden text-[0.9rem] sm:flex" />
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex cursor-pointer items-center gap-2 rounded-[var(--radius)] border border-border bg-bg-subtle py-1 pl-1.5 pr-1.5 transition-colors hover:bg-bg-hover sm:pr-2.5"
              aria-label="Account menu"
            >
              <Avatar>
                {user.image && <AvatarImage src={user.image} alt="" />}
                <AvatarFallback>{initial}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[120px] truncate text-[0.85rem] font-semibold text-text sm:inline">
                {displayName}
              </span>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="min-w-[220px]">
              {/* Identity + gamification (useful on mobile where the chips are hidden) */}
              <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-1">
                <LevelBadge xp={user.xp} />
                <StreakFlame count={user.streak} className="text-[0.85rem]" />
              </div>
              <DropdownMenuSeparator />

              <DropdownMenuLabel>Translations in</DropdownMenuLabel>
              <div className="flex gap-1 px-2 pb-1.5">
                {TARGET_LANGUAGES.map((t) => {
                  const active = t.code === user.nativeLang
                  return (
                    <button
                      key={t.code}
                      type="button"
                      disabled={isPending || active}
                      onClick={() => startTransition(async () => { await setNativeLang(t.code) })}
                      className={`flex-1 cursor-pointer rounded-[var(--radius-sm)] border px-2 py-1 text-[0.82rem] font-semibold transition-colors disabled:cursor-default ${
                        active
                          ? "border-primary bg-primary-subtle text-primary"
                          : "border-border bg-bg-subtle text-text-secondary hover:bg-bg-hover"
                      }`}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => startTransition(async () => { await signOut() })}
              >
                <LogOut size={14} />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
