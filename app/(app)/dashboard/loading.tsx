import { Skeleton } from "@/components/ui/skeleton"

// Streamed instantly while the server fetches dashboard stats.
export default function DashboardLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="mb-2 h-9 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Streak + level card */}
      <Skeleton className="mb-6 h-[104px] w-full rounded-[var(--radius-lg)]" />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[92px] rounded-[var(--radius)]" />
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-[118px] rounded-[var(--radius)]" />
        <Skeleton className="h-[118px] rounded-[var(--radius)]" />
      </div>

      {/* Recent */}
      <Skeleton className="mb-3 h-6 w-40" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[68px] rounded-[var(--radius)]" />
        ))}
      </div>
    </div>
  )
}
