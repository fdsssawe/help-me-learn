"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { LayoutDashboard, BookOpen, Zap, LogOut, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { ThemeToggle } from "./theme-toggle"
import { signOut } from "@/app/actions/auth"
import { setNativeLang } from "@/app/actions/user"
import { getCheckoutUrl } from "@/app/actions/billing"
import { TARGET_LANGUAGES } from "@/lib/enrichment/languages"

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/vocabulary", label: "Vocabulary", Icon: BookOpen },
  { href: "/quiz", label: "Quiz", Icon: Zap },
]

type NavUser = { name: string | null; email: string | null; image: string | null; nativeLang: string; plan: string }

export function Nav({ user }: { user: NavUser }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleUpgrade() {
    setMenuOpen(false)
    try {
      window.location.href = await getCheckoutUrl()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start checkout.")
    }
  }

  const initial =
    user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "?"
  const displayName = user.name ?? user.email?.split("@")[0] ?? "Account"

  return (
    <header className="sticky top-0 z-50 bg-bg-card border-b border-border shadow-sm">
      <div className="max-w-[1100px] mx-auto px-6 h-[60px] flex items-center justify-between gap-4">

        <Link
          href="/dashboard"
          className="font-display text-[1.35rem] font-bold text-primary tracking-tight no-underline shrink-0"
        >
          Lexora
        </Link>

        <nav className="flex gap-1 items-center">
          {NAV_LINKS.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--radius-sm)] text-[0.9rem] no-underline transition-all ${
                  active
                    ? "font-bold text-primary bg-primary-subtle"
                    : "font-medium text-text-secondary hover:bg-bg-subtle hover:text-text"
                }`}
              >
                <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-[var(--radius)] bg-bg-subtle border border-border cursor-pointer transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-primary text-primary-fg flex items-center justify-center text-[0.8rem] font-bold shrink-0">
                {initial}
              </div>
              <span className="text-[0.85rem] font-semibold text-text max-w-[100px] truncate">
                {displayName}
              </span>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="card-elevated animate-pop absolute top-[calc(100%+8px)] right-0 min-w-[200px] p-1.5 z-20">
                  <div className="px-3 pt-2 pb-1">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.06em] text-text-muted mb-1.5">Translations in</p>
                    <div className="flex gap-1">
                      {TARGET_LANGUAGES.map((t) => {
                        const active = t.code === user.nativeLang
                        return (
                          <button
                            key={t.code}
                            onClick={() => setNativeLang(t.code)}
                            className={`flex-1 px-2 py-1 rounded-[var(--radius-sm)] text-[0.82rem] font-semibold border cursor-pointer transition-colors ${
                              active
                                ? "bg-primary-subtle border-primary text-primary"
                                : "bg-bg-subtle border-border text-text-secondary hover:bg-bg-hover"
                            }`}
                          >
                            {t.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  {/* Upgrade to Pro temporarily hidden (payments paused until Paddle is live).
                  <div className="h-px bg-border my-1.5" />
                  {user.plan === "free" ? (
                    <button
                      onClick={handleUpgrade}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] border-0 bg-transparent text-primary text-[0.9rem] font-semibold cursor-pointer text-left transition-colors hover:bg-primary-subtle"
                    >
                      <Sparkles size={14} />
                      Upgrade to Pro
                    </button>
                  ) : (
                    <div className="w-full flex items-center gap-2 px-3 py-2 text-[0.9rem] font-semibold text-primary">
                      <Sparkles size={14} />
                      Pro plan
                    </div>
                  )}
                  */}
                  <div className="h-px bg-border my-1.5" />
                  <button
                    onClick={() => { signOut(); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] border-0 bg-transparent text-error text-[0.9rem] font-semibold cursor-pointer text-left transition-colors hover:bg-error-bg"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
