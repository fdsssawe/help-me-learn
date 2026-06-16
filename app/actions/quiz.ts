"use server"

import { subDays, startOfDay, endOfDay } from "date-fns"
import { revalidatePath } from "next/cache"
import type { Prisma } from "@/app/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { requireUserId as requireUser } from "@/lib/dal"
import { XP_PER_CORRECT, XP_QUIZ_COMPLETION_BONUS, BADGES } from "@/lib/levels"

type QuizMode = "last_lesson" | "last_week" | "random_30"
export type QuizStyle = "words" | "sentences"

export async function getQuizWords(
  mode: QuizMode,
  languageId?: string,
  style: QuizStyle = "words"
) {
  const userId = await requireUser()
  const now = new Date()
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nativeLang: true },
  })
  const nativeLang = user?.nativeLang ?? "en"

  const base: Prisma.WordWhereInput = { userId }
  if (languageId) base.languageId = languageId
  // Only quiz words enriched for the user's current native language (en/uk) —
  // otherwise hints/translations would be in the wrong language.
  if (style === "sentences") {
    // Cloze needs example sentences, which live on the (native-matched) lemma.
    base.lemma = { targetLang: nativeLang, examples: { some: {} } }
  } else {
    // Words style: native-matched lemmas, plus un-enriched words (manual translation).
    base.OR = [{ lemma: { targetLang: nativeLang } }, { lemmaId: null }]
  }

  const include = {
    lemma: {
      include: {
        examples: { orderBy: { order: "asc" as const } },
        // All sense glosses are valid answers ("inn, tavern, bistro…"), not just
        // the single stored Word.translation.
        senses: { orderBy: { order: "asc" as const } },
      },
    },
  }

  if (mode === "last_lesson") {
    const yesterday = subDays(now, 1)
    return prisma.word.findMany({
      where: { ...base, createdAt: { gte: startOfDay(yesterday), lte: endOfDay(yesterday) } },
      take: 30,
      include,
    })
  }
  if (mode === "last_week") {
    return prisma.word.findMany({
      where: { ...base, createdAt: { gte: subDays(now, 7) } },
      take: 30,
      include,
    })
  }
  const all = await prisma.word.findMany({ where: base, include })
  return all.sort(() => Math.random() - 0.5).slice(0, 30)
}

export async function saveQuizSession(data: {
  mode: QuizMode
  score: number
  total: number
  languageId?: string
  answers: { wordId: string; userAnswer: string; isCorrect: boolean }[]
}) {
  const userId = await requireUser()
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("User not found")

  // Anti-farm: award XP only for words gotten right for the FIRST time today.
  // Replaying the same quiz then earns nothing. (Run before inserting this
  // session so we only see prior sessions.)
  const correctWordIds = [...new Set(data.answers.filter((a) => a.isCorrect).map((a) => a.wordId))]
  const startToday = startOfDay(new Date())
  const priorCorrect = correctWordIds.length
    ? await prisma.quizAnswer.findMany({
        where: {
          isCorrect: true,
          wordId: { in: correctWordIds },
          quizSession: { userId, completedAt: { gte: startToday } },
        },
        select: { wordId: true },
      })
    : []
  const alreadyCounted = new Set(priorCorrect.map((a) => a.wordId))
  const newCorrect = correctWordIds.filter((id) => !alreadyCounted.has(id))
  const xpEarned =
    newCorrect.length * XP_PER_CORRECT +
    (newCorrect.length > 0 ? XP_QUIZ_COMPLETION_BONUS : 0)

  const session = await prisma.quizSession.create({
    data: {
      userId,
      mode: data.mode,
      score: data.score,
      total: data.total,
      xpEarned,
      ...(data.languageId ? { languageId: data.languageId } : {}),
      answers: {
        create: data.answers.map((a) => ({
          wordId: a.wordId,
          userAnswer: a.userAnswer,
          isCorrect: a.isCorrect,
        })),
      },
    },
  })

  const today = startOfDay(new Date())
  const lastStudied = user.lastStudiedAt ? startOfDay(user.lastStudiedAt) : null
  const yesterday = startOfDay(subDays(new Date(), 1))

  let newStreak = user.streak
  if (!lastStudied || lastStudied < yesterday) {
    newStreak = 1
  } else if (lastStudied.getTime() === yesterday.getTime()) {
    newStreak = user.streak + 1
  }

  const currentBadges: string[] = JSON.parse(user.badges)
  const newBadges = new Set(currentBadges)
  const newQuizCount = user.quizCount + 1
  const newXp = user.xp + xpEarned
  const wordCount = await prisma.word.count({ where: { userId } })

  if (!newBadges.has(BADGES.FIRST_QUIZ)) newBadges.add(BADGES.FIRST_QUIZ)
  if (newStreak >= 7) newBadges.add(BADGES.STREAK_7)
  if (wordCount >= 50) newBadges.add(BADGES.WORDS_50)
  if (data.total > 0 && data.score === data.total) newBadges.add(BADGES.PERFECT_SCORE)
  if (newQuizCount >= 10) newBadges.add(BADGES.QUIZZES_10)

  await prisma.user.update({
    where: { id: userId },
    data: {
      xp: newXp,
      streak: newStreak,
      bestStreak: Math.max(user.bestStreak, newStreak),
      lastStudiedAt: today,
      quizCount: newQuizCount,
      badges: JSON.stringify([...newBadges]),
    },
  })

  revalidatePath("/dashboard")
  return { sessionId: session.id, xpEarned }
}

export async function getQuizSession(sessionId: string) {
  const userId = await requireUser()
  return prisma.quizSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      answers: {
        include: { word: true },
      },
    },
  })
}

export async function getDashboardStats() {
  const userId = await requireUser()
  const [user, wordCount, quizCount, recentSessions] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.word.count({ where: { userId } }),
    prisma.quizSession.count({ where: { userId } }),
    prisma.quizSession.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
      take: 5,
      include: { language: { select: { name: true, emoji: true } } },
    }),
  ])
  return { user, wordCount, quizCount, recentSessions }
}
