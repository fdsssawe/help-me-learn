import Link from "next/link"
import { BookOpen, Calendar, Shuffle } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/dal"
import { getLanguages } from "@/app/actions/languages"
import { LanguageSelector } from "@/components/language-selector"
import { Button } from "@/components/ui/button"
import { subDays, startOfDay, endOfDay } from "date-fns"

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const { lang } = await searchParams
  const user = await getCurrentUser()
  const userId = user?.id

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card p-8 text-center max-w-[400px]">
          <p className="text-text-muted">Please sign in to take a quiz.</p>
        </div>
      </div>
    )
  }

  const now = new Date()
  const yesterday = subDays(now, 1)
  const langFilter = lang ? { languageId: lang } : {}

  const [yesterdayCount, weekCount, totalCount, languages] = await Promise.all([
    prisma.word.count({ where: { userId, ...langFilter, createdAt: { gte: startOfDay(yesterday), lte: endOfDay(yesterday) } } }),
    prisma.word.count({ where: { userId, ...langFilter, createdAt: { gte: subDays(now, 7) } } }),
    prisma.word.count({ where: { userId, ...langFilter } }),
    getLanguages(),
  ])

  const activeLang = languages.find((l) => l.id === lang)
  const langParam = lang ? `&lang=${lang}` : ""

  const modes = [
    { key: "last_lesson", Icon: BookOpen, label: "Last Lesson", description: "Review what you learned in your last study session", count: yesterdayCount, countLabel: "words from yesterday", href: `/quiz/session?mode=last_lesson${langParam}` },
    { key: "last_week", Icon: Calendar, label: "Last Week", description: "Reinforce everything from this week", count: weekCount, countLabel: "words this week", href: `/quiz/session?mode=last_week${langParam}` },
    { key: "random_30", Icon: Shuffle, label: "Random 30", description: "A surprise mix from your whole vocabulary", count: totalCount, countLabel: "words total", href: `/quiz/session?mode=random_30${langParam}` },
  ]

  const emptyState = (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageTitle activeLang={activeLang} />
      <LanguageSelector languages={languages} activeLangId={lang} basePath="/quiz" />
      <div className="py-16 text-center">
        <div className="flex justify-center mb-4 text-text-muted"><BookOpen size={56} strokeWidth={1.25} /></div>
        <h2 className="font-display text-[clamp(1.6rem,4vw,2rem)] text-text mb-3">
          {activeLang ? `No ${activeLang.name} words yet` : "No words yet"}
        </h2>
        <p className="text-text-muted mb-6 leading-relaxed max-w-md mx-auto">
          {activeLang
            ? `Add some ${activeLang.name} vocabulary before taking a quiz.`
            : "Add some vocabulary before taking a quiz. Even a handful of words makes for a great first session."}
        </p>
        <Button render={<Link href={lang ? `/vocabulary?lang=${lang}` : "/vocabulary"} />}>
          Go add some words
        </Button>
      </div>
    </div>
  )

  if (totalCount === 0) return emptyState

  return (
    <div className="animate-fade-in max-w-3xl mx-auto px-4 py-8">
      <PageTitle activeLang={activeLang} />
      <LanguageSelector languages={languages} activeLangId={lang} basePath="/quiz" />

      <div className="flex flex-col gap-4">
        {modes.map((mode, i) => {
          const disabled = mode.count === 0
          return (
            <div key={mode.key} className="animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
              {disabled ? (
                <div className="card flex items-start gap-4 p-6 opacity-50 cursor-not-allowed">
                  <ModeCardInner mode={mode} />
                </div>
              ) : (
                <Link href={mode.href} className="card flex items-start gap-4 p-6 no-underline transition-all cursor-pointer">
                  <ModeCardInner mode={mode} />
                </Link>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-8 text-[0.82rem] text-text-muted text-center">
        {totalCount} {totalCount === 1 ? "word" : "words"}{activeLang ? ` in ${activeLang.name}` : " in your vocabulary"}.{" "}
        <Link href={lang ? `/vocabulary?lang=${lang}` : "/vocabulary"} className="text-primary no-underline">
          Manage words →
        </Link>
      </p>
    </div>
  )
}

function PageTitle({ activeLang }: { activeLang?: { name: string } | undefined }) {
  return (
    <div className="mb-5">
      <h1 className="font-display text-[clamp(1.8rem,4vw,2.4rem)] text-text mb-1">
        {activeLang ? `${activeLang.name} Quiz` : "Daily Quiz"}
      </h1>
      <p className="text-text-secondary">Choose a mode and put your memory to the test.</p>
    </div>
  )
}

function ModeCardInner({ mode }: { mode: { Icon: LucideIcon; label: string; description: string; count: number; countLabel: string } }) {
  return (
    <>
      <div className="w-[52px] h-[52px] rounded-[var(--radius)] bg-bg-subtle flex items-center justify-center shrink-0 text-text-secondary">
        <mode.Icon size={24} strokeWidth={1.75} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
          <h2 className="font-display text-[1.2rem] text-text m-0">{mode.label}</h2>
          <span
            className="badge"
            style={{
              background: mode.count > 0 ? "var(--primary-subtle)" : "var(--bg-subtle)",
              color: mode.count > 0 ? "var(--primary)" : "var(--text-muted)",
              border: `1px solid ${mode.count > 0 ? "var(--primary)" : "var(--border)"}`,
            }}
          >
            {mode.count} {mode.countLabel}
          </span>
        </div>
        <p className="text-[0.9rem] text-text-secondary m-0">{mode.description}</p>
        {mode.count === 0 && <p className="text-[0.8rem] text-text-muted mt-1">No words available for this mode right now.</p>}
      </div>
    </>
  )
}
