import "server-only"

// Provider-agnostic machine translation. MyMemory now (free, no key, cached upstream
// per lemma so daily limits don't bite). Swap in DeepL later by editing only this file.
// Returns null on failure so callers can fall back to the source text.
export async function translateText(
  text: string,
  from: string,
  to: string
): Promise<string | null> {
  const q = text.trim()
  if (!q) return null
  if (from === to) return text
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${from}|${to}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as {
      responseStatus?: number
      responseData?: { translatedText?: string }
    }
    const t = data?.responseData?.translatedText
    return data?.responseStatus === 200 && typeof t === "string" ? t : null
  } catch {
    return null
  }
}
