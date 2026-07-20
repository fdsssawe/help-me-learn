import "server-only"
import type { User } from "@/app/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { enrichLemma, resolveHeadword } from "./enrich"
import { resolveLanguage } from "./languages"
import { isStopword } from "./stopwords"
import type { KaikkiEntry } from "./kaikki"
import { FREE_WORD_LIMIT, isPro } from "@/lib/billing"
import { sendEmail, ADMIN_EMAIL } from "@/lib/email"

// Bound the per-image work: at most this many unique dictionary words are
// resolved/enriched. kaikki lookups dominate wall-clock, so this caps latency
// (the /api/extract route also sets maxDuration as a backstop).
const MAX_CANDIDATES = 40
const POOL = 6

export type ExtractCandidate = {
  headword: string
  translation: string
  alreadySaved: boolean
}

export type AddExtractedResult = { added: number; skipped: number; hitLimit: boolean }

// Run `fn` over `items` with bounded concurrency (kaikki is rate-sensitive and
// we don't want dozens of parallel fetches).
async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let i = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      out[idx] = await fn(items[idx])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

// Resolve a user's Language row to its name + supported adapter code.
async function resolveUserLanguage(userId: string, languageId: string) {
  const lang = await prisma.language.findFirst({
    where: { id: languageId, userId },
    select: { name: true },
  })
  if (!lang) return null
  const adapter = resolveLanguage(lang.name)
  if (!adapter) return null
  return { name: lang.name, code: adapter.code }
}

// The user's existing vocabulary, as lowercased word texts + linked lemma ids,
// for de-duplicating extracted words against what they already have.
async function savedSets(userId: string) {
  const words = await prisma.word.findMany({
    where: { userId },
    select: { word: true, lemmaId: true },
  })
  const texts = new Set(words.map((w) => w.word.trim().toLowerCase()))
  const lemmaIds = new Set(words.map((w) => w.lemmaId).filter(Boolean) as string[])
  return { texts, lemmaIds }
}

// Given a list of raw tokens read from an image, return the dictionary words
// worth adding: function words dropped, inflected forms collapsed to their base
// form, non-dictionary junk removed, each translated (via the cached enrichment
// engine) and flagged if the user already has it. Does NOT save anything.
export async function extractCandidates(
  user: User,
  tokens: string[],
  languageId: string
): Promise<ExtractCandidate[]> {
  const lang = await resolveUserLanguage(user.id, languageId)
  if (!lang) return []

  // Normalize + de-dupe raw tokens; drop short tokens and function words.
  const seen = new Set<string>()
  const unique: string[] = []
  for (const raw of tokens) {
    const t = raw.trim().toLowerCase()
    if (t.length < 2 || seen.has(t) || isStopword(t, lang.code)) continue
    seen.add(t)
    unique.push(t)
    if (unique.length >= MAX_CANDIDATES) break
  }

  // Resolve each token to its dictionary headword (or null if not a real word).
  // resolveHeadword returns the headword's kaikki entries too, so we can hand
  // them to enrichLemma and avoid re-fetching the same word from kaikki.
  const resolved = await mapPool(unique, POOL, (t) => resolveHeadword(t, lang.name))
  const byHead = new Map<string, KaikkiEntry[]>()
  for (const r of resolved) if (r && !byHead.has(r.headword)) byHead.set(r.headword, r.entries)
  const headwords = [...byHead.keys()]

  const { texts, lemmaIds } = await savedSets(user.id)

  // Enrich each headword for its translation (cache hit after the first time;
  // on a cold word, reuse the entries fetched during resolution).
  const candidates = await mapPool(headwords, POOL, async (headword): Promise<ExtractCandidate | null> => {
    const lemma = await enrichLemma(headword, lang.name, user.nativeLang, byHead.get(headword))
    const translation = lemma?.senses[0]?.glosses.join(", ") ?? ""
    if (!translation) return null
    const alreadySaved = texts.has(headword) || (!!lemma && lemmaIds.has(lemma.id))
    return { headword, translation, alreadySaved }
  })

  return candidates.filter(Boolean) as ExtractCandidate[]
}

// Save the user-confirmed subset of extracted words. Enforces the free-word cap
// once against remaining quota, skips words the user already has, and links each
// new Word to its (already cached) enriched lemma.
export async function addExtractedWords(
  user: User,
  items: { headword: string; translation: string }[],
  languageId: string
): Promise<AddExtractedResult> {
  const lang = await resolveUserLanguage(user.id, languageId)
  if (!lang) return { added: 0, skipped: items.length, hitLimit: false }

  const { texts } = await savedSets(user.id)

  // Remaining quota (Pro is unlimited).
  let remaining = Infinity
  if (!isPro(user)) {
    const count = await prisma.word.count({ where: { userId: user.id } })
    remaining = Math.max(0, FREE_WORD_LIMIT - count)
  }

  let added = 0
  let skipped = 0
  let hitLimit = false
  const batchSeen = new Set<string>()
  const toCreate: {
    userId: string
    languageId: string
    lemmaId?: string
    word: string
    translation: string
  }[] = []

  for (const item of items) {
    const headword = item.headword.trim().toLowerCase()
    if (!headword) continue
    // Skip duplicates: already saved, or repeated within this batch.
    if (texts.has(headword) || batchSeen.has(headword)) {
      skipped++
      continue
    }
    if (added >= remaining) {
      hitLimit = true
      skipped++
      continue
    }
    const lemma = await enrichLemma(headword, lang.name, user.nativeLang)
    const translation = item.translation.trim() || lemma?.senses[0]?.glosses.join(", ") || ""
    if (!translation) {
      skipped++
      continue
    }
    batchSeen.add(headword)
    toCreate.push({
      userId: user.id,
      languageId,
      lemmaId: lemma?.id,
      word: headword,
      translation,
    })
    added++
  }

  if (toCreate.length) {
    await prisma.word.createMany({ data: toCreate })
  }

  // Notify admin once when a free user first bumps the cap (mirrors createWord).
  if (hitLimit && !isPro(user) && !user.limitReachedNotified) {
    await prisma.user.update({ where: { id: user.id }, data: { limitReachedNotified: true } })
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `Lexora: a user hit the ${FREE_WORD_LIMIT}-word free limit`,
      html: `<p>A user reached the free word limit while adding words from an image.</p>
<ul>
  <li><strong>Email:</strong> ${user.email ?? "(unknown)"}</li>
  <li><strong>Name:</strong> ${user.name ?? "(none)"}</li>
  <li><strong>User ID:</strong> ${user.id}</li>
</ul>`,
    })
  }

  return { added, skipped, hitLimit }
}
