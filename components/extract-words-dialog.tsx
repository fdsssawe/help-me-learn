"use client"

import { useRef, useState, useTransition } from "react"
import { ImagePlus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { addExtractedWords } from "@/app/actions/extract"
import type { ExtractCandidate } from "@/lib/enrichment/extract"

interface ExtractWordsDialogProps {
  languageId: string
  languageName: string
  atLimit: boolean
  onLimit: () => void
  onDone: () => void
}

// Client-side OCR (tesseract.js, WASM) → tokenize → server validates/translates
// → review checklist → save. No image ever leaves the browser; only a token list
// reaches the server.
export function ExtractWordsDialog({
  languageId,
  languageName,
  atLimit,
  onLimit,
  onDone,
}: ExtractWordsDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<null | "ocr" | "lookup">(null)
  const [progress, setProgress] = useState(0)
  const [open, setOpen] = useState(false)
  const [candidates, setCandidates] = useState<ExtractCandidate[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isSaving, startSaving] = useTransition()

  function pickImage() {
    if (atLimit) {
      onLimit()
      return
    }
    fileRef.current?.click()
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // allow re-picking the same file
    if (!file) return

    try {
      // 1) OCR in the browser (downloads WASM + Italian model on first run, cached).
      setBusy("ocr")
      setProgress(0)
      const { recognize } = await import("tesseract.js")
      const { data } = await recognize(file, "ita", {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100))
        },
      })

      // 2) Tokenize: letters only (handles elisions like dell'acqua → dell, acqua).
      const tokens = Array.from(
        new Set((data.text.toLowerCase().match(/\p{L}+/gu) ?? []).filter((t) => t.length >= 2))
      )
      if (!tokens.length) {
        toast.info("No text found in that image.")
        return
      }

      // 3) Server (/api/extract, longer maxDuration): filter, reduce to dictionary
      //    forms, translate, flag duplicates.
      setBusy("lookup")
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens, languageId }),
      })
      if (!res.ok) throw new Error(`extract failed: ${res.status}`)
      const { candidates: found } = (await res.json()) as { candidates: ExtractCandidate[] }
      if (!found.length) {
        toast.info(`No new ${languageName} words found in that image.`)
        return
      }
      setCandidates(found)
      setSelected(new Set(found.filter((c) => !c.alreadySaved).map((c) => c.headword)))
      setOpen(true)
    } catch (err) {
      console.error(err)
      toast.error("Couldn't read that image. Try a clearer photo.")
    } finally {
      setBusy(null)
      setProgress(0)
    }
  }

  function toggle(headword: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(headword)) next.delete(headword)
      else next.add(headword)
      return next
    })
  }

  const newCandidates = candidates.filter((c) => !c.alreadySaved)
  const allSelected = newCandidates.length > 0 && newCandidates.every((c) => selected.has(c.headword))

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(newCandidates.map((c) => c.headword)))
  }

  function handleConfirm() {
    const items = candidates
      .filter((c) => selected.has(c.headword))
      .map((c) => ({ headword: c.headword, translation: c.translation }))
    if (!items.length) {
      setOpen(false)
      return
    }
    startSaving(async () => {
      try {
        const res = await addExtractedWords(items, languageId)
        const parts = [`Added ${res.added} ${res.added === 1 ? "word" : "words"}`]
        if (res.skipped) parts.push(`${res.skipped} skipped`)
        toast.success(parts.join(" · "))
        setOpen(false)
        setCandidates([])
        setSelected(new Set())
        if (res.hitLimit) onLimit()
        onDone()
      } catch {
        toast.error("Couldn't save those words. Please try again.")
      }
    })
  }

  const busyLabel = busy === "ocr" ? (progress ? `Reading… ${progress}%` : "Reading…") : "Finding words…"

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <Button variant="secondary" onClick={pickImage} disabled={busy !== null}>
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {busyLabel}
          </>
        ) : (
          <>
            <ImagePlus className="size-4" />
            From image
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add words from image</DialogTitle>
            <DialogDescription>
              {newCandidates.length} new {languageName}{" "}
              {newCandidates.length === 1 ? "word" : "words"} found. Pick the ones to add.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-1">
            {newCandidates.length > 1 && (
              <label className="flex cursor-pointer items-center gap-2 border-b border-border py-2 text-[0.82rem] text-text-muted">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={allSelected}
                  onChange={toggleAll}
                />
                Select all
              </label>
            )}
            <ul className="divide-y divide-border">
              {candidates.map((c) => (
                <li key={c.headword}>
                  <label
                    className={`flex cursor-pointer items-start gap-3 py-2.5 ${
                      c.alreadySaved ? "opacity-55" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 accent-primary"
                      checked={selected.has(c.headword)}
                      onChange={() => toggle(c.headword)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-medium text-text">{c.headword}</span>
                        {c.alreadySaved && (
                          <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-[0.68rem] text-text-muted">
                            in your list
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-[0.85rem] text-text-secondary">
                        {c.translation}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isSaving || selected.size === 0}>
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              Add {selected.size > 0 ? selected.size : ""}{" "}
              {selected.size === 1 ? "word" : "words"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
