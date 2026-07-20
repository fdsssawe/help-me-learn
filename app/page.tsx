import Link from "next/link"
import { BookOpen, Zap, Flame } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/site"
import { LEVELS } from "@/lib/levels"

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
}

const FEATURES = [
  {
    Icon: BookOpen,
    title: "Build Your Vocabulary",
    desc: "Add words and translations in any language pair. Keep notes, track when you learned them.",
    colorClass: "text-primary",
    bgClass: "bg-primary/10",
  },
  {
    Icon: Zap,
    title: "Daily Quizzes",
    desc: "Test yesterday's lesson, this week's words, or a random mix. Short, focused, effective.",
    colorClass: "text-success",
    bgClass: "bg-success/10",
  },
  {
    Icon: Flame,
    title: "Streaks & Progress",
    desc: "Earn XP, level up, and keep your streak alive. Small wins every day add up to fluency.",
    colorClass: "text-streak",
    bgClass: "bg-streak/10",
  },
]

export default function LandingPage() {
  return (
    <div className="landing-bg min-h-dvh flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header */}
      <header className="px-6 h-16 flex items-center justify-between max-w-275 mx-auto w-full">
        <span className="font-display text-[1.4rem] font-bold text-primary tracking-[-0.02em]">
          Lexora
        </span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/sign-in" />}>Sign in</Button>
          <Button size="sm" nativeButton={false} render={<Link href="/sign-up" />}>Get started</Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-16 text-center max-w-190 mx-auto w-full">
        <div className="animate-fade-in inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary-subtle border border-primary/25 text-primary text-[0.8rem] font-bold tracking-[0.04em] uppercase mb-7">
          <Zap size={12} strokeWidth={2.5} /> Language learning, reimagined
        </div>

        <h1
          className="animate-slide-up font-display text-[clamp(2.4rem,6vw,4rem)] font-black leading-[1.1] tracking-[-0.03em] text-text mb-6"
          style={{ animationDelay: "0.05s" }}
        >
          Words that{" "}
          <em className="italic text-primary">actually</em>{" "}
          stick.
        </h1>

        <p
          className="animate-slide-up text-[1.15rem] leading-[1.7] text-text-secondary max-w-130 mb-10"
          style={{ animationDelay: "0.1s" }}
        >
          Lexora helps you build vocabulary that lasts — with daily quizzes,
          gentle streaks, and a cozy space to grow at your own pace.
        </p>

        <div
          className="animate-slide-up flex gap-3 flex-wrap justify-center"
          style={{ animationDelay: "0.15s" }}
        >
          <Button size="lg" nativeButton={false} render={<Link href="/sign-up" />}>
            Start learning — it&apos;s free
          </Button>
          <Button variant="secondary" size="lg" nativeButton={false} render={<Link href="/sign-in" />}>
            Sign in
          </Button>
        </div>

        <p
          className="animate-fade-in mt-7 text-[0.85rem] text-text-muted"
          style={{ animationDelay: "0.3s" }}
        >
          No credit card needed · Works on any device
        </p>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-275 mx-auto w-full">
        <h2 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold text-center mb-12 text-text tracking-[-0.02em]">
          Everything you need to learn a language
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-elevated p-7 pb-8">
              <div className={`w-13 h-13 rounded-(--radius) ${f.bgClass} flex items-center justify-center mb-4.5 ${f.colorClass}`}>
                <f.Icon size={24} strokeWidth={1.75} />
              </div>
              <h3 className="font-display text-[1.2rem] font-bold text-text mb-2.5">{f.title}</h3>
              <p className="text-[0.95rem] leading-[1.65] text-text-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Level progression teaser */}
      <section className="px-6 py-16 max-w-170 mx-auto w-full text-center">
        <h2 className="font-display text-[1.6rem] font-extrabold text-text mb-2 tracking-[-0.02em]">
          Your learning journey
        </h2>
        <p className="text-text-muted mb-8 text-[0.95rem]">
          Earn XP with every quiz and level up from Novice to Maestro.
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          {LEVELS.map((l, i) => (
            <div
              key={l.name}
              className="card px-4.5 py-2.5 transition-transform duration-200"
              style={{ opacity: 0.4 + i * 0.15, transform: `scale(${0.92 + i * 0.04})` }}
            >
              <div className="text-[0.75rem] text-text-muted mb-0.5">{l.minXp} XP</div>
              <div className="font-bold text-[0.9rem] text-text">{l.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-5 text-center text-[0.82rem] text-text-muted">
        <span className="font-display font-bold text-primary">Lexora</span>
        {" "}· Learn one word at a time.
      </footer>
    </div>
  )
}
