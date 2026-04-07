import { cn, trendIndicator } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string | number
  trend?: number
  accent?: 'success' | 'danger' | 'warning' | 'accent' | 'default'
  subtext?: string
}

const accentColors = {
  success: 'text-success',
  danger: 'text-danger',
  warning: 'text-warning',
  accent: 'text-accent-bright',
  default: 'text-text-primary',
}

export function MetricCard({ label, value, trend, accent = 'default', subtext }: MetricCardProps) {
  const t = trend != null ? trendIndicator(trend) : null
  return (
    <div className="rounded-card border border-border bg-bg-card p-4 transition-colors hover:border-border-active">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-gold">{label}</div>
      <div className={cn('font-mono text-2xl font-semibold', accentColors[accent])}>{value}</div>
      {(subtext || t) && (
        <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px]">
          {t && (
            <span style={{ color: t.color }}>
              {t.symbol} {Math.abs(trend!).toFixed(0)}%
            </span>
          )}
          {subtext && <span className="text-text-muted">{subtext}</span>}
        </div>
      )}
    </div>
  )
}
