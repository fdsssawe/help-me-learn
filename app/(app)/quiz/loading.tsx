import { Skeleton } from "@/components/ui/skeleton"

// Streamed instantly while the server counts quiz-ready words.
export default function QuizLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-5">
        <Skeleton className="mb-2 h-9 w-52" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      {/* Language pills */}
      <div className="mb-6 flex gap-2">
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>

      {/* Mode cards */}
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-[var(--radius)]" />
        ))}
      </div>
    </div>
  )
}
