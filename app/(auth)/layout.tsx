import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="landing-bg flex min-h-[100dvh] flex-col">
      <header className="flex h-16 items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-[1.3rem] font-bold text-primary no-underline"
        >
          Lexora
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6">{children}</main>
    </div>
  )
}
