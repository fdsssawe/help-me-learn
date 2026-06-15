"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Switch } from "@/components/ui/switch"

export function DirectionToggle({
  dir,
  style,
  lang,
}: {
  dir: "forward" | "reverse"
  style: "words" | "sentences"
  lang?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isReverse = dir === "reverse"

  function onChange(next: boolean) {
    startTransition(() => {
      const dirParam = next ? "&dir=reverse" : ""
      router.push(`/quiz?style=${style}${lang ? `&lang=${lang}` : ""}${dirParam}`)
    })
  }

  return (
    <div className="mb-6">
      <div className={`inline-flex items-center gap-2.5 transition-opacity ${isPending ? "opacity-60" : ""}`}>
        <span className={`text-[0.85rem] font-semibold transition-colors ${!isReverse ? "text-primary" : "text-text-muted"}`}>
          Word → translation
        </span>
        <Switch checked={isReverse} onCheckedChange={onChange} disabled={isPending} aria-label="Toggle quiz direction" />
        <span className={`text-[0.85rem] font-semibold transition-colors ${isReverse ? "text-primary" : "text-text-muted"}`}>
          Translation → word
        </span>
      </div>
      <p className="text-[0.78rem] text-text-muted mt-1.5">
        {isReverse
          ? "See the translation and type the original word."
          : "See the word and type its translation."}
      </p>
    </div>
  )
}
