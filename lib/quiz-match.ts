// Lenient answer matching for quizzes. Stored translations often hold several
// alternatives ("to bring, fetch, take, carry"); any single one should count,
// and the infinitive "to ", parentheticals, case and punctuation shouldn't matter.

export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, "") // drop parentheticals e.g. "(formal)"
    .replace(/^\s*to\s+/, "") // infinitive marker
    .replace(/[.!?,;]+$/, "") // trailing punctuation
    .replace(/\s+/g, " ")
    .trim()
}

// Split an accepted answer into its alternatives plus the whole normalized string.
function acceptedVariants(accepted: string): string[] {
  const parts = accepted.split(/[,;/]|\bor\b/i)
  const variants = parts.map(normalizeAnswer)
  variants.push(normalizeAnswer(accepted))
  return variants.filter(Boolean)
}

export function answerMatches(input: string, accepted: string): boolean {
  const want = normalizeAnswer(input)
  if (!want) return false
  return acceptedVariants(accepted).includes(want)
}
