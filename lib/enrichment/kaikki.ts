import "server-only"

// kaikki.org publishes machine-readable Wiktionary (Wiktextract) as per-word JSONL.
export type KaikkiSense = {
  glosses?: string[]
  raw_glosses?: string[]
  tags?: string[]
  // Present on inflected-form entries, e.g. dissetato → [{ word: "dissetare" }].
  form_of?: { word?: string }[]
}
export type KaikkiForm = { form?: string; tags?: string[] }
export type KaikkiEntry = {
  pos?: string
  senses?: KaikkiSense[]
  forms?: KaikkiForm[]
}

// URL shape: /dictionary/{Language}/meaning/{l}/{ll}/{word}.jsonl
export async function fetchKaikki(word: string, kaikkiLang: string): Promise<KaikkiEntry[]> {
  const w = word.trim().toLowerCase()
  if (!w) return []
  const l = w[0]
  const ll = w.slice(0, 2)
  const url = `https://kaikki.org/dictionary/${encodeURIComponent(kaikkiLang)}/meaning/${encodeURIComponent(l)}/${encodeURIComponent(ll)}/${encodeURIComponent(w)}.jsonl`
  const res = await fetch(url)
  if (!res.ok) return []
  const text = await res.text()
  return text
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as KaikkiEntry)
}
