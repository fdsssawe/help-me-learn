import type { getLemmaDetail } from "@/app/actions/words"

type Lemma = NonNullable<Awaited<ReturnType<typeof getLemmaDetail>>>

const POS_LABEL: Record<string, string> = {
  verb: "verb",
  noun: "noun",
  adj: "adjective",
  adjective: "adjective",
  adv: "adverb",
  adverb: "adverb",
}

function Highlighted({ text, offsets }: { text: string; offsets: number[] }) {
  if (offsets.length !== 2) return <>{text}</>
  const [a, b] = offsets
  return (
    <>
      {text.slice(0, a)}
      <mark className="bg-primary-subtle text-primary rounded-sm px-0.5 font-semibold">
        {text.slice(a, b)}
      </mark>
      {text.slice(b)}
    </>
  )
}

const sectionLabel = "text-[0.72rem] font-bold uppercase tracking-[0.06em] text-text-muted mb-1.5"

export function EnrichedDetail({ lemma }: { lemma: Lemma }) {
  const { senses, examples, conjugations } = lemma
  if (!senses.length && !examples.length && !conjugations.length) {
    return <p className="text-[0.85rem] text-text-muted">No dictionary data found for this word.</p>
  }

  const shownConj = conjugations.slice(0, 16)
  const moreConj = conjugations.length - shownConj.length

  return (
    <div className="flex flex-col gap-4 text-[0.9rem]">
      {senses.length > 0 && (
        <section>
          <h4 className={sectionLabel}>Meanings</h4>
          <ul className="flex flex-col gap-1">
            {senses.map((s) => (
              <li key={s.id} className="flex items-baseline gap-2 flex-wrap">
                <span className="badge bg-bg-subtle text-text-secondary shrink-0">
                  {POS_LABEL[s.pos] ?? s.pos}
                </span>
                <span className="text-text">{s.glosses.join("; ")}</span>
                {s.tags.length > 0 && (
                  <span className="text-[0.75rem] text-text-muted italic">{s.tags.join(", ")}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {examples.length > 0 && (
        <section>
          <h4 className={sectionLabel}>Examples</h4>
          <ul className="flex flex-col gap-2">
            {examples.map((e) => (
              <li key={e.id} className="border-l-2 border-border pl-3">
                <p className="text-text">
                  <Highlighted text={e.sourceText} offsets={e.targetOffsets} />
                </p>
                <p className="text-[0.82rem] text-text-muted">
                  <Highlighted text={e.targetText} offsets={e.translationOffsets} />
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {conjugations.length > 0 && (
        <section>
          <h4 className={sectionLabel}>Forms</h4>
          <div className="flex flex-wrap gap-1.5 items-center">
            {shownConj.map((c) => (
              <span
                key={c.id}
                title={c.tags.join(", ")}
                className="badge bg-bg-subtle text-text-secondary font-medium"
              >
                {c.form}
              </span>
            ))}
            {moreConj > 0 && <span className="text-[0.78rem] text-text-muted">+{moreConj} more</span>}
          </div>
        </section>
      )}
    </div>
  )
}
