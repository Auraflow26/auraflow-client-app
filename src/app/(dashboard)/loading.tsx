import { DashboardShell } from '@/components/layout/DashboardShell'
import { Skeleton, SkeletonMetricCard } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Directive skeletons */}
        <div className="space-y-2">
          <Skeleton height={12} width={100} />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-card border border-border bg-bg-card p-4 space-y-2">
              <Skeleton height={14} width="70%" />
              <Skeleton height={12} width="50%" />
              <Skeleton height={28} width={100} className="mt-1" />
            </div>
          ))}
        </div>

        {/* Metric card skeletons */}
        <div className="space-y-2">
          <Skeleton height={12} width={80} />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonMetricCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
