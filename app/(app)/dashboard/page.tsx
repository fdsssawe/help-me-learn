import Link from "next/link"
import { Flame, BookOpen, PenLine, Medal, Zap, Plus, Star, FileText, Sprout } from "lucide-react"
import { LangTag } from "@/components/lang-tag"
import { getDashboardStats } from "@/app/actions/quiz"
import { getLevelProgress, getXpToNextLevel } from "@/lib/levels"
import { BADGE_DISPLAY } from "@/lib/badge-display"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { XpBar } from "@/components/ui/xp-bar"
import { LevelBadge } from "@/components/ui/level-badge"

const MODE_LABELS: Record<string, string> = {
  last_lesson: "Last Lesson",
  last_week: "Last Week",
  random_30: "Random 30",
}

export default async function DashboardPage() {
  const { user, wordCount, quizCount, recentSessions } = await getDashboardStats()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card p-8 text-center max-w-[400px]">
          <p className="text-text-muted">Something went wrong loading your dashboard.</p>
        </div>
      </div>
    )
  }

  const progress = getLevelProgress(user.xp)
  const xpToNext = getXpToNextLevel(user.xp)
  const badges: string[] = JSON.parse(user.badges)
  const firstName = user.name?.split(" ")[0] ?? "there"

  return (
    <div className="animate-fade-in max-w-3xl mx-auto px-4 py-8">

      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-display text-[clamp(1.8rem,4vw,2.4rem)] text-text mb-1 leading-tight">
          Good to see you, {firstName}
        </h1>
        <p className="text-text-secondary">Keep up the great work — every word counts.</p>
      </div>

      {/* First-run onboarding nudge */}
      {wordCount === 0 && (
        <div className="card-elevated animate-slide-up mb-6 flex flex-col items-start gap-3 border-[1.5px] border-primary bg-primary-subtle p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-[1.15rem] font-bold text-text mb-1">Let&apos;s add your first words</h2>
            <p className="text-[0.9rem] text-text-secondary">
              Add a few words — snap a photo of a page or type them in — then quiz yourself to start your streak.
            </p>
          </div>
          <Button className="gap-1.5 shrink-0" nativeButton={false} render={<Link href="/vocabulary" />}>
            <Plus size={15} strokeWidth={2.5} />
            Add words
          </Button>
        </div>
      )}

      {/* Streak + Level */}
      <div className="card-elevated p-6 mb-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          {/* Streak */}
          <div className="flex items-center gap-3">
            <div className={user.streak > 0 ? "text-streak" : "text-text-muted opacity-40"}>
              <Flame size={36} strokeWidth={1.75} />
            </div>
            <div>
              <div className="font-display text-[2.2rem] font-extrabold leading-none text-streak">
                {user.streak}
              </div>
              <div className="text-[0.8rem] text-text-muted font-semibold tracking-wide">DAY STREAK</div>
            </div>
          </div>

          {/* Level + XP */}
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center justify-between mb-2">
              <LevelBadge xp={user.xp} />
              <span className="text-[0.82rem] text-text-muted">{user.xp} XP</span>
            </div>
            <XpBar value={progress} className="animate-xp-pulse" />
            {xpToNext > 0 && <div className="text-[0.78rem] text-text-muted mt-1.5">{xpToNext} XP to next level</div>}
            {xpToNext === 0 && <div className="text-[0.78rem] text-[var(--xp)] mt-1.5 font-bold">Max level reached!</div>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Words", value: wordCount, Icon: BookOpen },
          { label: "Quizzes", value: quizCount, Icon: PenLine },
          { label: "Best Streak", value: user.bestStreak, Icon: Medal },
        ].map(({ label, value, Icon }) => (
          <div key={label} className="card p-4 text-center">
            <div className="flex justify-center mb-1 text-text-secondary"><Icon size={20} strokeWidth={1.75} /></div>
            <div className="font-display text-[1.6rem] font-extrabold text-text leading-none">{value}</div>
            <div className="text-[0.75rem] text-text-muted font-semibold mt-0.5 tracking-wide">{label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Link
          href="/quiz"
          className="card flex flex-col gap-2 p-5 no-underline transition-all bg-primary-subtle border-[1.5px] border-primary"
        >
          <Zap size={22} strokeWidth={1.75} className="text-primary" />
          <span className="font-display text-[1.1rem] text-primary font-bold">Start Today&apos;s Quiz</span>
          <span className="text-[0.82rem] text-text-secondary">Test what you&apos;ve learned</span>
        </Link>
        <Link href="/vocabulary" className="card flex flex-col gap-2 p-5 no-underline transition-all">
          <Plus size={22} strokeWidth={1.75} className="text-text-secondary" />
          <span className="font-display text-[1.1rem] text-text font-bold">Add Words</span>
          <span className="text-[0.82rem] text-text-secondary">Grow your vocabulary</span>
        </Link>
      </div>

      {/* Recent quizzes */}
      <div className="mb-6">
        <h2 className="font-display text-[1.2rem] text-text mb-3">Recent Quizzes</h2>
        {recentSessions.length === 0 ? (
          <div className="card p-8 text-center text-text-muted">
            <div className="flex justify-center mb-2"><Sprout size={32} strokeWidth={1.5} /></div>
            <p className="text-[0.95rem]">No quizzes yet. Take your first one!</p>
            <Button size="sm" className="mt-4" nativeButton={false} render={<Link href="/quiz" />}>Start a quiz</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentSessions.map((session) => {
              const pct = session.total > 0 ? Math.round((session.score / session.total) * 100) : 0
              return (
                <div key={session.id} className="card flex items-center justify-between gap-4 flex-wrap px-[1.125rem] py-[0.875rem]">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: pct >= 80 ? "var(--success-bg)" : "var(--bg-subtle)", color: pct >= 80 ? "var(--success)" : "var(--text-muted)" }}
                    >
                      {pct >= 80 ? <Star size={15} strokeWidth={2} /> : <FileText size={15} strokeWidth={2} />}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[0.9rem] font-semibold text-text">{MODE_LABELS[session.mode] ?? session.mode}</span>
                        {session.language && (
                          <LangTag name={session.language.name} />
                        )}
                      </div>
                      <div className="text-[0.78rem] text-text-muted">
                        {new Date(session.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className="font-bold text-[0.95rem]"
                      style={{ color: pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--gold)" : "var(--error)" }}
                    >
                      {session.score}/{session.total}
                    </span>
                    <Badge variant="xp" size="sm">+{session.xpEarned} XP</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div>
          <h2 className="font-display text-[1.2rem] text-text mb-3">Your Badges</h2>
          <div className="flex gap-2 flex-wrap">
            {badges.map((key) => (
              <Badge key={key} variant="gold" className="animate-pop">
                {BADGE_DISPLAY[key] ?? key}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
