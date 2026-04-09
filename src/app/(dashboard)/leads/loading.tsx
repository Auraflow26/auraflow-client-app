import { DashboardShell } from '@/components/layout/DashboardShell'
import { SkeletonCard } from '@/components/ui/Skeleton'

export default function LeadsLoading() {
  return (
    <DashboardShell>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </DashboardShell>
  )
}
