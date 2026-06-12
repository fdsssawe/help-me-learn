import "server-only"
import type { Prisma } from "@/app/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { resolveLanguage, resolveTarget, type TargetLang } from "./languages"
import { fetchKaikki, type KaikkiEntry, type KaikkiForm } from "./kaikki"
import { fetchTatoeba, translationInLang } from "./tatoeba"
import { translateText } from "./translate"

const MAX_EXAMPLES = 6
const MIN_SENTENCE_LEN = 6

const LEMMA_INCLUDE = {
  senses: { orderBy: { order: "asc" } },
  examples: { orderBy: { order: "asc" } },
  conjugations: { orderBy: { order: "asc" } },
} as const

export type EnrichedLemma = Prisma.LemmaGetPayload<{ include: typeof LEMMA_INCLUDE }>

type RawSense = { pos: string; glosses: string[]; tags: string[]; order: number }

// ── normalization helpers ──────────────────────────────────────────────────

function normalizeSenses(entries: KaikkiEntry[]): RawSense[] {
  const senses: RawSense[] = []
  let order = 0
  for (const entry of entries) {
    const pos = entry.pos ?? "unknown"
    for (const s of entry.senses ?? []) {
      const glosses = s.glosses ?? s.raw_glosses ?? []
      if (!glosses.length) continue
      senses.push({ pos, glosses, tags: s.tags ?? [], order: order++ })
    }
  }
  return senses
}

// kaikki glosses are English. For non-English targets, translate each gloss,
// falling back to the English gloss when translation fails.
async function translateSenses(senses: RawSense[], target: TargetLang): Promise<RawSense[]> {
  if (!target.needsTranslation) return senses
  return Promise.all(
    senses.map(async (s) => {
      const glosses = await Promise.all(
        s.glosses.map(async (g) => (await translateText(g, "en", target.code)) ?? g)
      )
      return { ...s, glosses }
    })
  )
}

function normalizeConjugations(entries: KaikkiEntry[]) {
  const out: { form: string; tags: string[]; order: number }[] = []
  const seen = new Set<string>()
  let order = 0
  for (const entry of entries) {
    for (const f of entry.forms ?? []) {
      const form = f.form?.trim()
      const tags = f.tags ?? []
      if (!form || form === "-") continue
      if (tags.includes("table-tags") || tags.includes("inflection-template")) continue
      const key = `${form}|${tags.join(",")}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ form, tags, order: order++ })
    }
  }
  return out
}

function buildFormSet(headword: string, forms: KaikkiForm[]) {
  const set = new Set<string>([headword.toLowerCase()])
  for (const f of forms) if (f.form) set.add(f.form.toLowerCase())
  return set
}

function findOffsets(sentence: string, formSet: Set<string>, stem: string): number[] {
  const re = /\p{L}+/gu
  let m: RegExpExecArray | null
  while ((m = re.exec(sentence)) !== null) {
    if (formSet.has(m[0].toLowerCase())) return [m.index, m.index + m[0].length]
  }
  if (stem.length >= 3) {
    const m2 = new RegExp(`${stem}\\p{L}*`, "iu").exec(sentence)
    if (m2 && m2[0]) return [m2.index, m2.index + m2[0].length]
  }
  return []
}

function normalizeExamples(
  results: Awaited<ReturnType<typeof fetchTatoeba>>,
  headword: string,
  forms: KaikkiForm[],
  targetTatoeba: string
) {
  const formSet = buildFormSet(headword, forms)
  const stem = headword.slice(0, Math.max(4, headword.length - 3)).toLowerCase()
  const seen = new Set<string>()
  const candidates: {
    sourceText: string
    targetText: string
    difficulty: number
    targetOffsets: number[]
  }[] = []

  for (const r of results) {
    const translated = translationInLang(r.translations, targetTatoeba)
    if (!translated || !r.text || r.text.length < MIN_SENTENCE_LEN) continue
    const key = translated.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    candidates.push({
      sourceText: r.text,
      targetText: translated,
      difficulty: r.text.length,
      targetOffsets: findOffsets(r.text, formSet, stem),
    })
  }

  candidates.sort((a, b) => {
    const ah = a.targetOffsets.length ? 0 : 1
    const bh = b.targetOffsets.length ? 0 : 1
    return ah - bh || a.difficulty - b.difficulty
  })

  return candidates.slice(0, MAX_EXAMPLES).map((e, i) => ({ ...e, source: "tatoeba", order: i }))
}

// ── orchestrator ───────────────────────────────────────────────────────────

// Enrich (text, source language) for a translation target. Cached per
// (text, langCode, targetLang). Returns null if the language is unsupported
// or enrichment found no senses.
export async function enrichLemma(
  rawText: string,
  language: string,
  targetCode: string
): Promise<EnrichedLemma | null> {
  const adapter = resolveLanguage(language)
  if (!adapter) return null
  const target = resolveTarget(targetCode)
  const text = rawText.trim().toLowerCase()
  if (!text) return null

  const key = {
    text_langCode_targetLang: { text, langCode: adapter.code, targetLang: target.code },
  }

  const cached = await prisma.lemma.findUnique({ where: key, include: LEMMA_INCLUDE })
  if (cached?.status === "ready") return cached

  const lemma = await prisma.lemma.upsert({
    where: key,
    update: { status: "pending" },
    create: { text, langCode: adapter.code, targetLang: target.code, status: "pending" },
  })

  try {
    const [entries, tatoeba] = await Promise.all([
      fetchKaikki(text, adapter.kaikki),
      fetchTatoeba(text, adapter.tatoeba, target.tatoeba),
    ])
    const forms = entries.flatMap((e) => e.forms ?? [])
    const senses = await translateSenses(normalizeSenses(entries), target)
    const conjugations = normalizeConjugations(entries)
    const examples = normalizeExamples(tatoeba, text, forms, target.tatoeba)

    await prisma.$transaction([
      prisma.sense.deleteMany({ where: { lemmaId: lemma.id } }),
      prisma.example.deleteMany({ where: { lemmaId: lemma.id } }),
      prisma.conjugation.deleteMany({ where: { lemmaId: lemma.id } }),
    ])

    await prisma.lemma.update({
      where: { id: lemma.id },
      data: {
        status: senses.length ? "ready" : "failed",
        enrichedAt: new Date(),
        senses: { create: senses },
        examples: { create: examples },
        conjugations: { create: conjugations },
      },
    })

    return prisma.lemma.findUnique({ where: { id: lemma.id }, include: LEMMA_INCLUDE })
  } catch {
    await prisma.lemma.update({ where: { id: lemma.id }, data: { status: "failed" } })
    return null
  }
}
