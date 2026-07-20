import "server-only"

// High-frequency function words to drop from image-extracted text: articles,
// prepositions (simple + articulated), conjunctions, common pronouns, and the
// most common auxiliary/copula forms. These are valid dictionary words but not
// worth surfacing as vocabulary to learn. Keyed by langCode so more source
// languages can be added alongside the enrichment registry.
const STOPWORDS: Record<string, Set<string>> = {
  it: new Set([
    // articles
    "il", "lo", "la", "i", "gli", "le", "l", "un", "uno", "una",
    // simple + articulated prepositions
    "di", "a", "da", "in", "con", "su", "per", "tra", "fra",
    "del", "dello", "della", "dei", "degli", "delle", "dell",
    "al", "allo", "alla", "ai", "agli", "alle", "all",
    "dal", "dallo", "dalla", "dai", "dagli", "dalle", "dall",
    "nel", "nello", "nella", "nei", "negli", "nelle", "nell",
    "col", "coi", "sul", "sullo", "sulla", "sui", "sugli", "sulle", "sull",
    // conjunctions
    "e", "ed", "o", "od", "ma", "però", "anche", "come", "che", "se",
    "perché", "perche", "quindi", "mentre", "oppure", "né", "ne",
    // pronouns / determiners
    "io", "tu", "lui", "lei", "noi", "voi", "loro", "esso", "essa",
    "mi", "ti", "ci", "vi", "si", "me", "te", "se", "sé",
    "questo", "questa", "questi", "queste", "quello", "quella", "quelli", "quelle",
    "chi", "cui", "quale", "quali", "cosa", "che",
    "mio", "mia", "miei", "mie", "tuo", "tua", "tuoi", "tue",
    "suo", "sua", "suoi", "sue", "nostro", "nostra", "vostro", "vostra",
    // common adverbs / particles
    "non", "più", "piu", "meno", "molto", "poco", "già", "gia", "ancora",
    "sempre", "mai", "qui", "qua", "lì", "là", "la", "ci", "ne", "sì", "si", "no",
    // most common essere/avere/fare forms
    "è", "e", "sono", "sei", "siamo", "siete", "era", "erano", "essere", "stato",
    "ho", "hai", "ha", "abbiamo", "avete", "hanno", "avere", "avuto",
    "ho", "fa", "fai", "fanno",
  ]),
}

// True if the token is a function word to skip for the given source language.
export function isStopword(token: string, langCode: string): boolean {
  const set = STOPWORDS[langCode]
  if (!set) return false
  return set.has(token.trim().toLowerCase())
}
