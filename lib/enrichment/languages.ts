// Language-adapter registry. Adding a language = add an entry here (config-level),
// provided kaikki + Tatoeba cover it. Everything downstream is keyed by `code`.
export type LangAdapter = {
  code: string // app langCode, e.g. "it"
  label: string // "Italian"
  aliases: string[] // names that may appear as Language.name (lowercased)
  kaikki: string // kaikki.org language name
  tatoeba: string // ISO 639-3 used by Tatoeba
  wiktionary: string // Wiktionary subdomain for word suggestions (opensearch)
  deepl?: string // DeepL code (fallback translation; unused in MVP)
}

export const LANGUAGES: LangAdapter[] = [
  {
    code: "it",
    label: "Italian",
    aliases: ["italian", "italiano", "it"],
    kaikki: "Italian",
    tatoeba: "ita",
    wiktionary: "it",
    deepl: "IT",
  },
  {
    code: "es",
    label: "Spanish",
    aliases: ["spanish", "español", "espanol", "es"],
    kaikki: "Spanish",
    tatoeba: "spa",
    wiktionary: "es",
    deepl: "ES",
  },
]

// Resolve a user's Language.name (or a code) to an adapter. Returns undefined for
// unsupported languages — callers should skip enrichment gracefully.
export function resolveLanguage(nameOrCode: string | null | undefined): LangAdapter | undefined {
  if (!nameOrCode) return undefined
  const n = nameOrCode.trim().toLowerCase()
  return LANGUAGES.find(
    (l) => l.code === n || l.label.toLowerCase() === n || l.aliases.includes(n)
  )
}

// Translation/display target languages (the user's native language). kaikki glosses
// are English, so `needsTranslation` marks targets that require an MT step.
export type TargetLang = {
  code: string // "en" | "uk"
  label: string
  tatoeba: string // ISO 639-3 for Tatoeba example translations
  needsTranslation: boolean
}

export const TARGET_LANGUAGES: TargetLang[] = [
  { code: "en", label: "English", tatoeba: "eng", needsTranslation: false },
  { code: "uk", label: "Ukrainian", tatoeba: "ukr", needsTranslation: true },
]

// Always returns a target (defaults to English).
export function resolveTarget(code: string | null | undefined): TargetLang {
  return TARGET_LANGUAGES.find((t) => t.code === code) ?? TARGET_LANGUAGES[0]
}
