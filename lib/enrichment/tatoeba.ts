import "server-only"

// Tatoeba: example sentences with linked translations.
export type TatoebaTranslation = { text: string; lang: string }
export type TatoebaResult = {
  text: string
  translations?: TatoebaTranslation[][]
}

export async function fetchTatoeba(
  word: string,
  fromCode: string,
  toCode: string
): Promise<TatoebaResult[]> {
  const url = `https://tatoeba.org/en/api_v0/search?from=${fromCode}&to=${toCode}&query=${encodeURIComponent(word)}&sort=relevance`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = (await res.json()) as { results?: TatoebaResult[] }
  return data.results ?? []
}

export function translationInLang(
  translations: TatoebaTranslation[][] | undefined,
  lang: string
): string | null {
  for (const group of translations ?? []) {
    for (const t of group ?? []) {
      if (t.lang === lang && t.text) return t.text
    }
  }
  return null
}
