export const LEVELS = [
  { name: "Novice",      minXp: 0,    maxXp: 99,   color: "#9A8578" },
  { name: "Apprentice",  minXp: 100,  maxXp: 299,  color: "#6BAE82" },
  { name: "Scholar",     minXp: 300,  maxXp: 699,  color: "#5B8FCF" },
  { name: "Expert",      minXp: 700,  maxXp: 1499, color: "#C8603A" },
  { name: "Maestro",     minXp: 1500, maxXp: Infinity, color: "#8B5CF6" },
] as const

export type LevelName = (typeof LEVELS)[number]["name"]

export function getLevel(xp: number) {
  return LEVELS.findLast((l) => xp >= l.minXp) ?? LEVELS[0]
}

export function getLevelProgress(xp: number) {
  const level = getLevel(xp)
  if (level.maxXp === Infinity) return 100
  const range = level.maxXp - level.minXp + 1
  const progress = xp - level.minXp
  return Math.round((progress / range) * 100)
}

export function getXpToNextLevel(xp: number) {
  const level = getLevel(xp)
  if (level.maxXp === Infinity) return 0
  return level.maxXp + 1 - xp
}

export const XP_PER_CORRECT = 10
export const XP_QUIZ_COMPLETION_BONUS = 20
export const BADGES = {
  FIRST_QUIZ: "first_quiz",
  STREAK_7: "streak_7",
  WORDS_50: "words_50",
  PERFECT_SCORE: "perfect_score",
  QUIZZES_10: "quizzes_10",
} as const
