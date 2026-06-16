// Streamed instantly while the server fetches words — gives a fast First
// Contentful Paint instead of blocking on the (cross-region) DB queries.
export default function VocabularyLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div>
          <div className="h-8 w-44 rounded-md bg-bg-subtle mb-2" />
          <div className="h-4 w-28 rounded bg-bg-subtle" />
        </div>
        <div className="h-9 w-28 rounded-[var(--radius)] bg-bg-subtle" />
      </div>

      {/* Language filter pills */}
      <div className="flex gap-2 mb-5">
        <div className="h-7 w-16 rounded-full bg-bg-subtle" />
        <div className="h-7 w-20 rounded-full bg-bg-subtle" />
        <div className="h-7 w-16 rounded-full bg-bg-subtle" />
      </div>

      {/* Word rows */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex-1">
              <div className="h-4 w-32 rounded bg-bg-subtle mb-2" />
              <div className="h-3 w-48 rounded bg-bg-subtle" />
            </div>
            <div className="h-6 w-6 rounded bg-bg-subtle" />
          </div>
        ))}
      </div>
    </div>
  )
}
