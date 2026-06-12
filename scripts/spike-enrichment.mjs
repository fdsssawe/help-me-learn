// ============================================================================
// PROTOTYPE — throwaway enrichment spike. DELETE ME once the question is answered.
//
// Question: can kaikki.org (Wiktextract) + Tatoeba populate our planned
//   Lemma / Sense / Translation / Example / Conjugation shape with
//   good-enough quality for Italian, with zero cost / no API keys?
//
// Run: node scripts/spike-enrichment.mjs   (Node 18+, uses global fetch)
// No persistence, no error handling beyond what keeps it runnable.
// ============================================================================

const WORDS = ["affrontare", "portare", "casa"]
const LANG = "Italian"
const LANG_CODE = "it"
const MAX_EXAMPLES = 4

// ── source: kaikki.org (machine-readable Wiktionary) ───────────────────────
// per-word URL: /dictionary/{Language}/meaning/{l}/{ll}/{word}.jsonl
async function fetchKaikki(word) {
  const l = word[0].toLowerCase()
  const ll = word.slice(0, 2).toLowerCase()
  const url = `https://kaikki.org/dictionary/${LANG}/meaning/${l}/${ll}/${word}.jsonl`
  const res = await fetch(url)
  if (!res.ok) return []
  const text = await res.text()
  return text.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line))
}

// ── source: Tatoeba (example sentences + linked translations) ──────────────
async function fetchTatoeba(word) {
  const url = `https://tatoeba.org/en/api_v0/search?from=ita&to=eng&query=${encodeURIComponent(word)}&sort=relevance`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()
  return data.results ?? []
}

// ── naive target-word highlight: match the lemma stem (first ~5 chars) ─────
function findOffsets(sentence, word) {
  const stem = word.slice(0, Math.min(5, word.length))
  const re = new RegExp(`\\b${stem}\\w*`, "i")
  const m = re.exec(sentence)
  return m ? [m.index, m.index + m[0].length] : null
}

function firstEnglish(translations) {
  for (const group of translations ?? []) {
    for (const t of group ?? []) {
      if (t.lang === "eng" && t.text) return t.text
    }
  }
  return null
}

// ── normalize one word into our planned model ──────────────────────────────
async function enrich(word) {
  const [kaikkiEntries, tatoebaResults] = await Promise.all([
    fetchKaikki(word),
    fetchTatoeba(word),
  ])

  const lemma = { text: word, langCode: LANG_CODE, status: "ready", senses: [], conjugations: [] }

  // senses + translations + part of speech, from kaikki
  let order = 0
  for (const entry of kaikkiEntries) {
    const pos = entry.pos ?? "unknown"
    for (const s of entry.senses ?? []) {
      const glosses = s.glosses ?? s.raw_glosses ?? []
      if (!glosses.length) continue
      lemma.senses.push({
        order: order++,
        pos,
        tags: s.tags ?? [],
        cefr: null, // not in kaikki — would come from a CEFR list later
        translations: glosses.map((g, i) => ({ targetLang: "en", text: g, order: i })),
      })
    }
    // conjugations / inflected forms (verbs carry a full table)
    for (const f of entry.forms ?? []) {
      if (!f.form || f.form === "-") continue
      lemma.conjugations.push({ form: f.form, tags: f.tags ?? [] })
    }
  }

  // examples, from Tatoeba — pre-translated where available
  const examples = []
  for (const r of tatoebaResults) {
    const en = firstEnglish(r.translations)
    if (!en) continue
    examples.push({
      sourceText: r.text,
      targetText: en,
      source: "tatoeba",
      difficulty: r.text.length, // length proxy → enables easy→hard ordering
      targetOffsets: findOffsets(r.text, word),
    })
    if (examples.length >= MAX_EXAMPLES) break
  }
  examples.sort((a, b) => a.difficulty - b.difficulty) // easy → hard

  return { lemma, examples, _counts: {
    kaikkiEntries: kaikkiEntries.length,
    senses: lemma.senses.length,
    conjugations: lemma.conjugations.length,
    tatoebaTotal: tatoebaResults.length,
    examplesUsable: examples.length,
  } }
}

// ── pretty-print so we can eyeball quality ─────────────────────────────────
function hl(sentence, offsets) {
  if (!offsets) return sentence
  const [a, b] = offsets
  return sentence.slice(0, a) + "[[" + sentence.slice(a, b) + "]]" + sentence.slice(b)
}

function print(word, result) {
  const { lemma, examples, _counts } = result
  console.log("\n" + "=".repeat(72))
  console.log(`WORD: ${word}  (lang=${lemma.langCode})`)
  console.log(`counts: ${JSON.stringify(_counts)}`)
  console.log("-".repeat(72))

  console.log("SENSES / TRANSLATIONS / POS:")
  for (const s of lemma.senses) {
    const tags = s.tags.length ? `  {${s.tags.join(", ")}}` : ""
    console.log(`  • [${s.pos}] ${s.translations.map((t) => t.text).join(" / ")}${tags}`)
  }

  if (lemma.conjugations.length) {
    console.log(`\nCONJUGATIONS / FORMS (${lemma.conjugations.length} total, showing 10):`)
    for (const c of lemma.conjugations.slice(0, 10)) {
      console.log(`  • ${c.form}  {${(c.tags ?? []).join(", ")}}`)
    }
  }

  console.log(`\nEXAMPLES (easy→hard, target word in [[brackets]]):`)
  for (const e of examples) {
    console.log(`  IT: ${hl(e.sourceText, e.targetOffsets)}`)
    console.log(`  EN: ${e.targetText}   (len=${e.difficulty})`)
  }
}

for (const word of WORDS) {
  try {
    print(word, await enrich(word))
  } catch (err) {
    console.log(`\n!! ${word} failed: ${err.message}`)
  }
}
console.log("\n" + "=".repeat(72) + "\nspike done.\n")
