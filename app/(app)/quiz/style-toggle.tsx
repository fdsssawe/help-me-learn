"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Switch } from "@/components/ui/switch"

export function StyleToggle({ style, lang }: { style: "words" | "sentences"; lang?: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isSentences = style === "sentences"

  function onChange(next: boolean) {
    startTransition(() => {
      router.push(`/quiz?style=${next ? "sentences" : "words"}${lang ? `&lang=${lang}` : ""}`)
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
