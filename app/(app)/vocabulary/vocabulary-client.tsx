"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Sprout, Plus, X, ChevronDown, ListChecks, Loader2 } from "lucide-react"
import { createWord, updateWord, deleteWord, deleteWords, suggestWords, getLemmaDetail } from "@/app/actions/words"
import { LanguageSelector } from "@/components/language-selector"
import { LangTag } from "@/components/lang-tag"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmDialog } from "@/components/ui/alert-dialog"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Autocomplete, AutocompleteInput, AutocompleteContent, AutocompleteItem } from "@/components/ui/autocomplete"
import { EnrichedDetail } from "@/components/enriched-detail"
import { ExtractWordsDialog } from "@/components/extract-words-dialog"
import { resolveLanguage } from "@/lib/enrichment/languages"
import { getCheckoutUrl } from "@/app/actions/billing"
import { FREE_WORD_LIMIT, WORD_LIMIT_NUDGE_AT } from "@/lib/billing"
import { toast } from "sonner"

const NO_LANG = "__none__"
import type { getWords } from "@/app/actions/words"
import type { getLanguages } from "@/app/actions/languages"

type Word = Awaited<ReturnType<typeof getWords>>[number]
type Language = Awaited<ReturnType<typeof getLanguages>>[number]

interface VocabularyClientProps {
  words: Word[]
  languages: Language[]
  activeLangId?: string
  plan: string
  totalWords: number
}

type LemmaDetail = NonNullable<Awaited<ReturnType<typeof getLemmaDetail>>>

// Pending deletion, driving the shared confirm dialog.
type PendingDelete =
  | { type: "single"; id: string; word: string }
  | { type: "bulk"; count: number }

function isEnriched(word: Word) {
  const c = word.lemma?._count
  return !!c && (c.senses > 0 || c.examples > 0 || c.conjugations > 0)
}

export function VocabularyClient({ words, languages, activeLangId, plan, totalWords }: VocabularyClientProps) {
  const router = useRouter()
  // Default language for the add form: the filtered language, else the only one,
  // else the last used (= most recent word's language, since words are newest-first).
  const defaultLangId =
    activeLangId ??
    (languages.length === 1
      ? languages[0].id
      : words.find((w) => w.languageId)?.languageId ?? "")
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  // Lazily-loaded enrichment detail per lemma id (fetched on first expand, cached).
  const [details, setDetails] = useState<Record<string, LemmaDetail>>({})
  const [loadingDetail, setLoadingDetail] = useState<Set<string>>(new Set())
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestOpen, setSuggestOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [addForm, setAddForm] = useState({ word: "", translation: "", notes: "", languageId: defaultLangId })
  // Revealed when auto-translation fails so the user can supply one manually.
  const [needsManualTranslation, setNeedsManualTranslation] = useState(false)
  const [editForm, setEditForm] = useState({ word: "", translation: "", notes: "", languageId: "" })
  const [formError, setFormError] = useState("")
  const [showPaywall, setShowPaywall] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  // Multi-select delete.
  const [selectionMode, setSelectionMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const atLimit = plan === "free" && totalWords >= FREE_WORD_LIMIT

  // Language used by the image word-extraction flow: prefer the active language,
  // else the add-form default, else the first — restricted to enrichment-supported
  // languages (only those have a dictionary to OCR against). Undefined → hide the button.
  const supportedLangs = languages.filter((l) => resolveLanguage(l.name))
  const extractLang =
    supportedLangs.find((l) => l.id === activeLangId) ??
    supportedLangs.find((l) => l.id === defaultLangId) ??
    supportedLangs[0]

  async function handleUpgrade() {
    setUpgrading(true)
    try {
      const url = await getCheckoutUrl()
      window.location.href = url
    } catch (err) {
      setUpgrading(false)
      toast.error(err instanceof Error ? err.message : "Couldn't start checkout.")
    }
  }

  const filtered = words.filter((w) => {
    const q = search.toLowerCase()
    return (
      w.word.toLowerCase().includes(q) ||
      w.translation.toLowerCase().includes(q) ||
      (w.notes ?? "").toLowerCase().includes(q)
    )
  })

  function toggleOpen(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Toggle a row and, when opening, kick off the (cached) detail fetch.
  function handleToggle(word: Word) {
    const willOpen = !openIds.has(word.id)
    toggleOpen(word.id)
    if (willOpen && word.lemma) loadDetail(word.lemma.id)
  }

  // Fetch a lemma's full enrichment detail on first expand; cache thereafter.
  async function loadDetail(lemmaId: string) {
    if (details[lemmaId] || loadingDetail.has(lemmaId)) return
    setLoadingDetail((prev) => new Set(prev).add(lemmaId))
    try {
      const detail = await getLemmaDetail(lemmaId)
      if (detail) setDetails((prev) => ({ ...prev, [lemmaId]: detail }))
    } finally {
      setLoadingDetail((prev) => {
        const next = new Set(prev)
        next.delete(lemmaId)
        return next
      })
    }
  }

  function resetAddForm() {
    setAddForm({ word: "", translation: "", notes: "", languageId: defaultLangId })
    setSuggestions([])
    setSuggestOpen(false)
    setFormError("")
    setNeedsManualTranslation(false)
    setShowAddForm(false)
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!addForm.word.trim()) { setFormError("Enter a word."); return }
    setFormError("")
    startTransition(async () => {
      try {
        const res = await createWord({
          word: addForm.word.trim(),
          translation: addForm.translation.trim() || undefined,
          notes: addForm.notes.trim() || undefined,
          languageId: addForm.languageId || undefined,
        })
        if (!res.ok) {
          if (res.reason === "limit") {
            resetAddForm()
            setShowPaywall(true)
          } else {
            // Reveal a manual translation field so the user can save anyway.
            setNeedsManualTranslation(true)
            setFormError(res.message)
          }
          return
        }
        toast.success("Word added")
        resetAddForm()
        router.refresh()
      } catch {
        setFormError("Something went wrong. Please try again.")
      }
    })
  }

  function handleWordChange(value: string) {
    setAddForm((f) => ({ ...f, word: value }))
    // Picking a suggestion fills the input with it — close and don't refetch.
    if (suggestions.includes(value)) {
      setSuggestions([])
      setSuggestOpen(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const langName = languages.find((l) => l.id === addForm.languageId)?.name
    const q = value.trim()
    if (q.length < 2 || !langName) {
      setSuggestions([])
      setSuggestOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await suggestWords(q, langName)
        const filtered = results.filter((r) => r.toLowerCase() !== q.toLowerCase())
        setSuggestions(filtered)
        setSuggestOpen(filtered.length > 0)
      } catch {
        setSuggestions([])
        setSuggestOpen(false)
      }
    }, 120)
  }

  function startEdit(word: Word) {
    setEditingId(word.id)
    setEditForm({ word: word.word, translation: word.translation, notes: word.notes ?? "", languageId: word.languageId ?? "" })
    setFormError("")
    setShowAddForm(false)
  }

  function handleEditSubmit(e: React.FormEvent, id: string) {
    e.preventDefault()
    if (!editForm.word.trim() || !editForm.translation.trim()) { setFormError("Word and translation are required."); return }
    setFormError("")
    startTransition(async () => {
      await updateWord(id, { word: editForm.word.trim(), translation: editForm.translation.trim(), notes: editForm.notes.trim() || undefined, languageId: editForm.languageId || null })
      setEditingId(null)
      toast.success("Changes saved")
      router.refresh()
    })
  }

  // ── Multi-select ──────────────────────────────────────────────────────────
  function enterSelectionMode() {
    setSelectionMode(true)
    setShowAddForm(false)
    setEditingId(null)
  }
  function exitSelectionMode() {
    setSelectionMode(false)
    setSelected(new Set())
  }
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const allFilteredSelected = filtered.length > 0 && filtered.every((w) => selected.has(w.id))
  function toggleSelectAll() {
    setSelected(allFilteredSelected ? new Set() : new Set(filtered.map((w) => w.id)))
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return
    if (pendingDelete.type === "single") {
      const id = pendingDelete.id
      setDeletingId(id)
      startTransition(async () => {
        await deleteWord(id)
        setSelected((prev) => { const n = new Set(prev); n.delete(id); return n })
        setDeletingId(null)
        setPendingDelete(null)
        toast.success("Word deleted")
        router.refresh()
      })
    } else {
      const ids = [...selected]
      startTransition(async () => {
        await deleteWords(ids)
        setSelected(new Set())
        setSelectionMode(false)
        setPendingDelete(null)
        toast.success(`${ids.length} ${ids.length === 1 ? "word" : "words"} deleted`)
        router.refresh()
      })
    }
  }

  const activeLang = languages.find((l) => l.id === activeLangId)
  const langLabel = (id: string) =>
    !id || id === NO_LANG ? "No language" : languages.find((l) => l.id === id)?.name ?? "No language"
  const supportedLangSelected = !!resolveLanguage(
    languages.find((l) => l.id === addForm.languageId)?.name
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div>
          <h1 className="font-display text-[clamp(1.6rem,4vw,2.2rem)] text-text mb-1">
            {activeLang ? activeLang.name : "My Vocabulary"}
          </h1>
          <p className="text-text-muted text-[0.9rem]">
            {words.length} {words.length === 1 ? "word" : "words"}
            {activeLang ? ` in ${activeLang.name}` : " across all languages"}
          </p>
          {plan === "free" && totalWords >= WORD_LIMIT_NUDGE_AT && (
            <p className={`text-[0.78rem] mt-0.5 ${atLimit ? "text-error font-semibold" : "text-text-muted"}`}>
              {totalWords} / {FREE_WORD_LIMIT} words on the free plan{atLimit ? " — limit reached" : ""}
            </p>
          )}
        </div>
        {!selectionMode && (
          <div className="flex items-center gap-2">
            {words.length > 0 && (
              <Button variant="ghost" className="gap-1.5" onClick={enterSelectionMode}>
                <ListChecks size={15} strokeWidth={2} />
                Select
              </Button>
            )}
            {extractLang && (
              <ExtractWordsDialog
                languageId={extractLang.id}
                languageName={extractLang.name}
                atLimit={atLimit}
                onLimit={() => setShowPaywall(true)}
                onDone={() => router.refresh()}
              />
            )}
            <Button
              className="gap-1.5"
              onClick={() => {
                if (!showAddForm && atLimit) { setShowPaywall(true); return }
                setShowAddForm((v) => { if (!v) setAddForm((f) => ({ ...f, languageId: defaultLangId })); return !v })
                setEditingId(null)
              }}
              disabled={isPending}
            >
              {showAddForm ? <><X size={14} strokeWidth={2.5} />Cancel</> : <><Plus size={14} strokeWidth={2.5} />Add Word</>}
            </Button>
          </div>
        )}
      </div>

      <LanguageSelector languages={languages} activeLangId={activeLangId} basePath="/vocabulary" />

      {showPaywall && (
        <div className="card-elevated animate-slide-up p-6 mb-5 text-center">
          <h2 className="font-display text-[1.25rem] text-text mb-1.5">Upgrade to Pro</h2>
          <p className="text-text-muted text-[0.92rem] mb-4 max-w-md mx-auto">
            The free plan holds up to {FREE_WORD_LIMIT} words. Go Pro for an unlimited vocabulary.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleUpgrade} disabled={upgrading}>{upgrading ? "Opening checkout…" : "Upgrade to Pro"}</Button>
            <Button variant="ghost" onClick={() => setShowPaywall(false)}>Maybe later</Button>
          </div>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="card-elevated animate-slide-up p-6 mb-5">
          <h2 className="font-display text-[1.1rem] text-text mb-4">Add a new word</h2>
          <form onSubmit={handleAddSubmit} className="flex flex-col gap-3">
            {languages.length > 0 && (
              <div>
                <label className={labelCls}>Language <span className="font-normal opacity-70">(for suggestions & auto-translate)</span></label>
                <Select value={addForm.languageId || NO_LANG} onValueChange={(v) => setAddForm((f) => ({ ...f, languageId: v === NO_LANG ? "" : String(v) }))}>
                  <SelectTrigger><SelectValue>{(value) => langLabel(String(value ?? ""))}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_LANG}>No language</SelectItem>
                    {languages.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className={labelCls}>Word *</label>
              <Autocomplete mode="none" value={addForm.word} onValueChange={handleWordChange} open={suggestOpen} onOpenChange={setSuggestOpen} openOnInputClick={false}>
                <AutocompleteInput placeholder="Start typing…" autoFocus />
                {suggestions.length > 0 && (
                  <AutocompleteContent>
                    {suggestions.map((s) => (
                      <AutocompleteItem key={s} value={s}>{s}</AutocompleteItem>
                    ))}
                  </AutocompleteContent>
                )}
              </Autocomplete>
              <p className="text-[0.78rem] text-text-muted mt-1">
                {supportedLangSelected
                  ? "Translation, examples & conjugations are added automatically."
                  : "Pick a supported language above for suggestions & auto-translate."}
              </p>
            </div>
            {needsManualTranslation && (
              <div>
                <label className={labelCls}>Translation</label>
                <input
                  className="input"
                  placeholder="Type the translation…"
                  autoFocus
                  value={addForm.translation}
                  onChange={(e) => setAddForm((f) => ({ ...f, translation: e.target.value }))}
                />
              </div>
            )}
            <div>
              <label className={labelCls}>Notes <span className="font-normal opacity-70">(optional)</span></label>
              <textarea className="input resize-y" placeholder="Any context, usage example, or memory trick…" rows={2} value={addForm.notes} onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            {formError && <p className="text-[0.85rem] text-error">{formError}</p>}
            <div className="flex gap-2">
              <Button size="sm" type="submit" disabled={isPending}>{isPending ? "Looking it up…" : "Save word"}</Button>
              <Button variant="ghost" size="sm" type="button" onClick={resetAddForm}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      {words.length > 0 && (
        <div className="mb-4">
          <input className="input" aria-label="Search vocabulary" placeholder="Search words, translations, notes…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      )}

      {/* Selection action bar */}
      {selectionMode && (
        <div className="sticky top-[68px] z-30 mb-3 flex items-center justify-between gap-3 rounded-[var(--radius)] border border-primary/40 bg-primary-subtle px-3 py-2 shadow-[var(--shadow-sm)] animate-fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={exitSelectionMode}
              aria-label="Exit selection"
              className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary transition-colors hover:bg-bg-hover cursor-pointer"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
            <span className="text-[0.9rem] font-semibold text-text truncate">
              {selected.size} selected
            </span>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-[0.82rem] font-semibold text-primary hover:underline cursor-pointer shrink-0"
            >
              {allFilteredSelected ? "Clear" : "Select all"}
            </button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            disabled={selected.size === 0 || isPending}
            onClick={() => setPendingDelete({ type: "bulk", count: selected.size })}
          >
            <Trash2 size={14} strokeWidth={2.2} />
            Delete
          </Button>
        </div>
      )}

      {/* Word list */}
      {words.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="flex justify-center mb-3 text-text-muted"><Sprout size={48} strokeWidth={1.25} /></div>
          <h2 className="font-display text-[1.3rem] text-text mb-2">
            {activeLang ? `No ${activeLang.name} words yet` : "Your vocabulary is empty"}
          </h2>
          <p className="text-text-muted text-[0.95rem] mb-5">
            {activeLang ? `Add your first ${activeLang.name} word to start building this collection.` : "Add your first word to start building your collection."}
          </p>
          <Button className="gap-1.5" onClick={() => { setAddForm((f) => ({ ...f, languageId: defaultLangId })); setShowAddForm(true) }}>
            <Plus size={14} strokeWidth={2.5} />
            {activeLang ? `Add a ${activeLang.name} word` : "Add your first word"}
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center text-text-muted"><p>No words match your search.</p></div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((word) => {
            if (editingId === word.id) {
              return (
                <div key={word.id} className="card-elevated animate-slide-up p-5">
                  <form onSubmit={(e) => handleEditSubmit(e, word.id)} className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Word *</label>
                        <input className="input" value={editForm.word} onChange={(e) => setEditForm((f) => ({ ...f, word: e.target.value }))} autoFocus />
                      </div>
                      <div>
                        <label className={labelCls}>Translation *</label>
                        <input className="input" value={editForm.translation} onChange={(e) => setEditForm((f) => ({ ...f, translation: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Notes</label>
                      <textarea className="input resize-y" rows={2} value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} />
                    </div>
                    {languages.length > 0 && (
                      <div>
                        <label className={labelCls}>Language</label>
                        <Select value={editForm.languageId || NO_LANG} onValueChange={(v) => setEditForm((f) => ({ ...f, languageId: v === NO_LANG ? "" : String(v) }))}>
                          <SelectTrigger><SelectValue>{(value) => langLabel(String(value ?? ""))}</SelectValue></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NO_LANG}>No language</SelectItem>
                            {languages.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {formError && <p className="text-[0.85rem] text-error">{formError}</p>}
                    <div className="flex gap-2">
                      <Button variant="success" size="sm" type="submit" disabled={isPending}>{isPending ? "Saving…" : "Save changes"}</Button>
                      <Button variant="ghost" size="sm" type="button" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </form>
                </div>
              )
            }

            const showDetails = isEnriched(word)
            const open = openIds.has(word.id)
            const isSelected = selected.has(word.id)
            const isDeleting = deletingId === word.id

            return (
              <Collapsible
                key={word.id}
                open={open}
                onOpenChange={() => { if (!selectionMode) handleToggle(word) }}
                className={`card animate-fade-in transition-shadow ${isSelected ? "ring-2 ring-primary" : ""}`}
              >
                <div
                  className={`flex items-start gap-3 px-[1.125rem] py-[0.875rem] ${selectionMode ? "cursor-pointer select-none" : ""}`}
                  onClick={selectionMode ? () => toggleSelect(word.id) : undefined}
                >
                  {selectionMode && (
                    <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(word.id)}
                        aria-label={`Select ${word.word}`}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-bold text-text">{word.word}</span>
                      <span className="text-text-muted text-[0.85rem]">→</span>
                      <span className="text-[0.95rem] text-text-secondary">{word.translation}</span>
                    </div>
                    {word.notes && <p className="text-[0.8rem] text-text-muted mt-0.5 truncate">{word.notes}</p>}
                    <div className="flex items-center gap-2 mt-0.5">
                      {!activeLangId && word.language && (
                        <>
                          <LangTag name={word.language.name} />
                          <span className="text-text-muted text-[0.7rem]">·</span>
                        </>
                      )}
                      <span className="text-[0.72rem] text-text-muted">
                        {new Date(word.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                  {!selectionMode && (
                    <div className="flex gap-1 shrink-0 items-center">
                      {showDetails && (
                        <Button variant="ghost" size="icon" aria-label={open ? "Hide dictionary details" : "Show dictionary details"} title={open ? "Hide details" : "Dictionary details"} onClick={() => handleToggle(word)}>
                          <ChevronDown size={16} strokeWidth={2} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" aria-label={`Edit ${word.word}`} title="Edit" onClick={() => startEdit(word)}>
                        <Pencil size={14} strokeWidth={2} />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Delete ${word.word}`} title="Delete" onClick={() => setPendingDelete({ type: "single", id: word.id, word: word.word })} disabled={isDeleting}>
                        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} strokeWidth={2} />}
                      </Button>
                    </div>
                  )}
                </div>
                {showDetails && word.lemma && !selectionMode && (
                  <CollapsibleContent>
                    <div className="border-t border-border px-[1.125rem] py-3.5">
                      {details[word.lemma.id] ? (
                        <EnrichedDetail lemma={details[word.lemma.id]} />
                      ) : (
                        <div className="animate-pulse flex flex-col gap-2">
                          <div className="h-3.5 w-24 rounded bg-bg-subtle" />
                          <div className="h-3 w-3/4 rounded bg-bg-subtle" />
                          <div className="h-3 w-2/3 rounded bg-bg-subtle" />
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                )}
              </Collapsible>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => { if (!o) setPendingDelete(null) }}
        title={
          pendingDelete?.type === "bulk"
            ? `Delete ${pendingDelete.count} ${pendingDelete.count === 1 ? "word" : "words"}?`
            : "Delete this word?"
        }
        description={
          pendingDelete?.type === "single"
            ? `“${pendingDelete.word}” will be removed from your vocabulary. This cannot be undone.`
            : "The selected words will be removed from your vocabulary. This cannot be undone."
        }
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        pending={isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

const labelCls = "block text-[0.82rem] text-text-secondary mb-1 font-semibold"
