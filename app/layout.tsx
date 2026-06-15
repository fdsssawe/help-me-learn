import type { Metadata } from "next"
import { Fraunces, Nunito, Geist } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { PostHogProvider } from "@/components/posthog-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
})

const nunito = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "LinguaFlow — Learn Languages Joyfully",
  description: "Build vocabulary that sticks with daily quizzes, streaks, and a warm, encouraging space to grow.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(fraunces.variable, nunito.variable, "font-sans", geist.variable)}>
      <body>
        <ThemeProvider>
          <PostHogProvider>{children}</PostHogProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
