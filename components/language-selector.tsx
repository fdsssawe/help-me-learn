"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Globe, Plus, X, Check } from "lucide-react"
import { LangDot } from "./lang-tag"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { ConfirmDialog } from "@/components/ui/alert-dialog"
import { LANGUAGES } from "@/lib/enrichment/languages"
import { createLanguage, deleteLanguage } from "@/app/actions/languages"

type Language = {
  id: string
  name: string
  emoji: string
  _count: { words: number }
}

// Only languages the enrichment engine supports (see lib/enrichment/languages.ts).
// Add a language there and it appears here automatically.
const PRESETS = LANGUAGES.map((l) => l.label)

interface LanguageSelectorProps {
  languages: Language[]
  activeLangId?: string
  basePath: string
}

export function LanguageSelector({ languages, activeLangId, basePath }: LanguageSelectorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)

  const addedNames = new Set(languages.map((l) => l.name.toLowerCase()))

  function navigate(langId?: string) {
    startTransition(() => {
      router.push(langId ? `${basePath}?lang=${langId}` : basePath)
    })
  }

  function handleAddPreset(name: string) {
    if (addedNames.has(name.toLowerCase())) return
    startTransition(async () => {
      const created = await createLanguage({ name, emoji: "" })
      setPopoverOpen(false)
      router.refresh()
      router.push(`${basePath}?lang=${created.id}`)
    })
  }

  function confirmDelete() {
    if (!pendingDelete) return
    const { id } = pendingDelete
    startTransition(async () => {
      await deleteLanguage(id)
      setPendingDelete(null)
      if (activeLangId === id) router.push(basePath)
      else router.refresh()
    })
  }

  return (
    <>
      <div className="mb-6">
        <div className={`flex items-center gap-1.5 flex-wrap transition-opacity ${isPending ? "opacity-60" : ""}`}>
          {/* All pill */}
          <Pill active={!activeLangId} onClick={() => navigate()}>
            <Globe size={13} strokeWidth={2} />
            All
          </Pill>

          {/* Language pills */}
          {languages.map((lang) => {
            const isActive = activeLangId === lang.id
            return (
              <div key={lang.id} className="group relative inline-flex">
                <Pill active={isActive} onClick={() => navigate(lang.id)}>
                  {lang.name}
                  <span className="font-bold opacity-65">{lang._count.words}</span>
                </Pill>
                <button
                  onClick={(e) => { e.stopPropagation(); setPendingDelete({ id: lang.id, name: lang.name }) }}
                  aria-label={`Remove ${lang.name}`}
                  title={`Remove ${lang.name}`}
                  className="absolute -right-1 -top-1 w-[16px] h-[16px] rounded-full bg-error text-white border border-bg-card flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm cursor-pointer"
                >
                  <X size={9} strokeWidth={3} />
                </button>
              </div>
            )
          })}

          {/* Add language popover */}
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.82rem] font-semibold
                cursor-pointer border-[1.5px] border-dashed transition-all
                ${popoverOpen ? "border-primary text-primary" : "border-border text-text-muted"}
              `}
            >
              <Plus size={13} strokeWidth={2.5} />
              Add language
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[340px]">
              <p className="text-[0.75rem] font-bold text-text-muted uppercase tracking-[0.07em] mb-2.5">
                Supported languages
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {PRESETS.map((name) => {
                  const already = addedNames.has(name.toLowerCase())
                  return (
                    <button
                      key={name}
                      onClick={() => handleAddPreset(name)}
                      disabled={already || isPending}
                      className={`
                        flex items-center gap-2 px-2.5 py-[7px] rounded-[var(--radius-sm)]
                        border text-[0.84rem] font-semibold text-left transition-all
                        ${already
                          ? "bg-success-bg border-success text-success opacity-70 cursor-default"
                          : "bg-bg-subtle border-border text-text-secondary hover:bg-primary-subtle hover:border-primary hover:text-primary cursor-pointer"
                        }
                      `}
                    >
                      {already
                        ? <Check size={14} strokeWidth={2.5} className="shrink-0 text-success" />
                        : <LangDot name={name} size={10} />
                      }
                      {name}
                    </button>
                  )
                })}
              </div>
              <p className="text-[0.75rem] text-text-muted mt-3">
                More languages coming soon.
              </p>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => { if (!open) setPendingDelete(null) }}
        title={`Remove ${pendingDelete?.name ?? "language"}?`}
        description={
          <>
            All words tagged as <strong>{pendingDelete?.name}</strong> will stay in your vocabulary
            but will lose their language tag. This cannot be undone.
          </>
        }
        confirmLabel="Remove language"
        pendingLabel="Removing…"
        pending={isPending}
        onConfirm={confirmDelete}
      />
    </>
  )
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 rounded-full text-[0.85rem] font-semibold
        cursor-pointer border-[1.5px] px-3.5 py-1.5 transition-colors whitespace-nowrap
        ${active
          ? "bg-primary border-primary text-primary-fg"
          : "bg-bg-subtle border-border text-text-secondary"
        }
      `}
    >
      {children}
    </button>
  )
}
