"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getAuthUser, getCurrentUser, requireUserId as requireUser } from "@/lib/dal"
import { enrichLemma } from "@/lib/enrichment/enrich"
import { resolveLanguage } from "@/lib/enrichment/languages"
import { FREE_WORD_LIMIT, isPro } from "@/lib/billing"

// Prefix suggestions for the add-word field, from Wiktionary's opensearch API
// (real headwords for the language → they'll enrich). Cheap auth check (no upsert).
export async function suggestWords(prefix: string, languageName?: string): Promise<string[]> {
  const user = await getAuthUser()
  if (!user) return []
  const q = prefix.trim()
  if (q.length < 2 || !languageName) return []
  const adapter = resolveLanguage(languageName)
  if (!adapter?.wiktionary) return []
  const url = `https://${adapter.wiktionary}.wiktionary.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=8&namespace=0&format=json`
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Lexora/0.1 (language-learning app)" },
    })
    if (!res.ok) return []
    const data = (await res.json()) as [string, string[], string[], string[]]
    return Array.isArray(data?.[1]) ? data[1] : []
  } catch {
    return []
  }
}

export async function getWords(languageId?: string) {
  const userId = await requireUser()
  return prisma.word.findMany({
    where: { userId, ...(languageId ? { languageId } : {}) },
    orderBy: { createdAt: "desc" },
    include: {
      language: { select: { name: true, emoji: true } },
      lemma: {
        include: {
          senses: { orderBy: { order: "asc" } },
          examples: { orderBy: { order: "asc" } },
          conjugations: { orderBy: { order: "asc" } },
        },
      },
    },
  })
}

// Expected, user-facing outcomes are RETURNED (not thrown): Next.js redacts
// thrown Error messages from server actions in production, so the client can't
// reliably read them. Only genuinely unexpected failures throw.
export type CreateWordResult =
  | { ok: true }
  | { ok: false; reason: "limit" }
  | { ok: false; reason: "no_translation"; message: string }

export async function createWord(data: {
  word: string
  translation?: string
  notes?: string
  languageId?: string
}): Promise<CreateWordResult> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")
  const userId = user.id

  // Free plan word cap (Pro is unlimited).
  if (!isPro(user)) {
    const count = await prisma.word.count({ where: { userId } })
    if (count >= FREE_WORD_LIMIT) return { ok: false, reason: "limit" }
  }

  const word = data.word.trim()
  let translation = data.translation?.trim() ?? ""
  let lemmaId: string | undefined

  // Auto-enrich when the word is tagged with a supported language. The first
  // sense's glosses become the translation when the user didn't type one.
  if (data.languageId) {
    const lang = await prisma.language.findFirst({
      where: { id: data.languageId, userId },
      select: { name: true },
    })
    if (lang) {
      const lemma = await enrichLemma(word, lang.name, user.nativeLang)
      if (lemma) {
        lemmaId = lemma.id
        if (!translation && lemma.senses[0]) translation = lemma.senses[0].glosses.join(", ")
      }
    }
  }

  if (!translation) {
    return {
      ok: false,
      reason: "no_translation",
      message:
        "Couldn't find this word in the dictionary — check the spelling, or add a translation yourself.",
    }
  }

  await prisma.word.create({
    data: { word, translation, notes: data.notes, languageId: data.languageId, lemmaId, userId },
  })
  revalidatePath("/vocabulary")
  return { ok: true }
}

export async function updateWord(
  id: string,
  data: { word: string; translation: string; notes?: string; languageId?: string | null }
) {
  const userId = await requireUser()
  await prisma.word.updateMany({ where: { id, userId }, data })
  revalidatePath("/vocabulary")
}

export async function deleteWord(id: string) {
  const userId = await requireUser()
  await prisma.word.deleteMany({ where: { id, userId } })
  revalidatePath("/vocabulary")
}

export async function getWordCountByDate() {
  const userId = await requireUser()
  const words = await prisma.word.findMany({
    where: { userId },
    select: { createdAt: true },
  })
  return words.length
}
