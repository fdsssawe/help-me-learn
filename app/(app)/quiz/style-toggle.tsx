"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Switch } from "@/components/ui/switch"

export function StyleToggle({ style, lang, dir }: { style: "words" | "sentences"; lang?: string; dir?: "forward" | "reverse" }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isSentences = style === "sentences"

  function onChange(next: boolean) {
    startTransition(() => {
      // Reverse direction only applies to Words style; drop it when switching to Sentences.
      const dirParam = !next && dir === "reverse" ? "&dir=reverse" : ""
      router.push(`/quiz?style=${next ? "sentences" : "words"}${lang ? `&lang=${lang}` : ""}${dirParam}`)
    })
  }

  return (
    <div className="mb-6">
      <div className={`inline-flex items-center gap-2.5 transition-opacity ${isPending ? "opacity-60" : ""}`}>
        <span className={`text-[0.85rem] font-semibold transition-colors ${!isSentences ? "text-primary" : "text-text-muted"}`}>
          Words
        </span>
        <Switch checked={isSentences} onCheckedChange={onChange} disabled={isPending} aria-label="Toggle quiz style" />
        <span className={`text-[0.85rem] font-semibold transition-colors ${isSentences ? "text-primary" : "text-text-muted"}`}>
          Sentences
        </span>
      </div>
      <p className="text-[0.78rem] text-text-muted mt-1.5">
        {isSentences
          ? "Fill the missing word into a real example sentence."
          : "Translate each word."}
      </p>
    </div>
  )
}
