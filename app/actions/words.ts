"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getAuthUser, requireUserId as requireUser } from "@/lib/dal"
import { enrichLemma } from "@/lib/enrichment/enrich"
import { resolveLanguage } from "@/lib/enrichment/languages"

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
      headers: { "User-Agent": "LinguaFlow/0.1 (language-learning app)" },
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

export async function createWord(data: {
  word: string
  translation?: string
  notes?: string
  languageId?: string
}) {
  const userId = await requireUser()
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
      const lemma = await enrichLemma(word, lang.name)
      if (lemma) {
        lemmaId = lemma.id
        if (!translation && lemma.senses[0]) translation = lemma.senses[0].glosses.join(", ")
      }
    }
  }

  if (!translation) {
    throw new Error(
      "Couldn't auto-translate this word — add a translation, or tag it with a supported language (Italian)."
    )
  }

  await prisma.word.create({
    data: { word, translation, notes: data.notes, languageId: data.languageId, lemmaId, userId },
  })
  revalidatePath("/vocabulary")
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
