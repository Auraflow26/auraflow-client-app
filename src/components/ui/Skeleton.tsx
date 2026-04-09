import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  height?: string | number
  width?: string | number
}

export function Skeleton({ className, height, width }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-white/5', className)}
      style={{ height, width }}
    />
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-card border border-border bg-bg-card p-4 space-y-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton height={16} width="55%" />
          <Skeleton height={12} width="35%" />
        </div>
        <div className="space-y-2 text-right">
          <Skeleton height={14} width={60} />
          <Skeleton height={10} width={40} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Skeleton height={20} width={70} className="rounded-full" />
        <Skeleton height={10} width={50} />
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton height={34} className="flex-1" />
        <Skeleton height={34} width={64} />
      </div>
    </div>
  )
}

export function SkeletonMetricCard() {
  return (
    <div className="rounded-card border border-border bg-bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton height={12} width={80} />
        <Skeleton height={16} width={16} className="rounded-full" />
      </div>
      <Skeleton height={32} width={90} />
      <Skeleton height={10} width={60} />
    </div>
  )
}
