# Enrichment spike — verdict

**Question:** Can kaikki.org (Wiktextract) + Tatoeba populate our Lemma/Sense/
Translation/Example/Conjugation model with good-enough Italian quality, at $0 / no keys?

**Answer: YES — proceed.** Both sources are public, no API key, no cost. Run with
`node scripts/spike-enrichment.mjs` (delete script + this note once absorbed into real code).

## What's great (kaikki — the dictionary side)
- **Senses & translations**: clean, accurate, and **multiple meanings are already
  separated** — `portare` → bring/carry/wear/lead/transmit/propose; `casa` →
  house/home/family/.../brothel. Glosses ARE the English translation → **no DeepL needed
  for headwords**.
- **Part of speech + tags**: verb/noun with transitive/feminine/figurative/colloquial tags.
- **Conjugations/forms**: full table for verbs (~66–67 forms) with structured
  person/tense/mood tags; nouns give plural + diminutive/augmentative.

## What needs work (Tatoeba — the example side)
1. **Highlighting is unreliable with a naive stem.** 5-char stem "porta" missed the
   inflected "porti". FIX: match example tokens against the **kaikki `forms` set** (all
   conjugations) instead of a guessed stem — kaikki already gives us every inflection.
2. **Trivial / near-duplicate sentences** ("We face you" ×3, "Casa!"). FIX: pull more
   results, filter min length + require the target form present, dedupe by EN translation.
3. **Difficulty = sentence length** is a crude but acceptable first proxy for easy→hard.

## Model implications confirmed
- Keep `Sense` as the unit (multiple meanings) ✓
- Store kaikki `forms` as `Conjugation` rows — doubles as the **highlight dictionary** ✓
- `Example.targetOffsets` should be computed from the forms set, not a stem ✓
- CEFR is NOT in kaikki — would need a separate CEFR word-list later (optional) ✓
