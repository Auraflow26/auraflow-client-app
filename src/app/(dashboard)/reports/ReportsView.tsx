'use client'

import { useMemo, useState } from 'react'
import { ScoreGauge } from '@/components/ui/ScoreGauge'
import { LeadTrend } from '@/components/charts/LeadTrend'
import { SourceBreakdown } from '@/components/charts/SourceBreakdown'
import { ScoreHistory } from '@/components/charts/ScoreHistory'
import { cn, formatCurrency, formatDuration, formatPercent } from '@/lib/utils'
import type { ClientProfile, DailyMetrics, Lead, LeadSource } from '@/lib/types'

type Period = 'week' | 'month' | 'quarter'

const periodDays: Record<Period, number> = { week: 7, month: 30, quarter: 90 }
const periodLabel: Record<Period, string> = { week: 'This Week', month: 'This Month', quarter: 'This Quarter' }

interface Props {
  profile: ClientProfile
  metrics: DailyMetrics[]
  leadSources: Pick<Lead, 'source'>[]
}

export function ReportsView({ profile, metrics, leadSources }: Props) {
  const [period, setPeriod] = useState<Period>('month')

  const windowed = useMemo(() => {
    const days = periodDays[period]
    return metrics.slice(-days)
  }, [metrics, period])

  const agg = useMemo(() => {
    const sum = (k: keyof DailyMetrics) =>
      windowed.reduce((acc, m) => acc + (Number(m[k]) || 0), 0)
    const avg = (k: keyof DailyMetrics) => (windowed.length ? sum(k) / windowed.length : 0)
    return {
      leads: sum('leads_captured'),
      qualified: sum('leads_qualified'),
      booked: sum('leads_booked'),
      won: sum('leads_won'),
      adSpend: sum('ad_spend'),
      adRevenue: sum('ad_revenue'),
      roas: avg('ad_roas'),
      cpl: avg('cost_per_lead'),
      responseTime: avg('avg_response_time_sec'),
      adminHours: sum('admin_hours_saved'),
      reviewsNew: sum('reviews_received'),
      reviewsResponded: sum('reviews_responded'),
      avgRating: windowed.length
        ? windowed.reduce((a, m) => a + (m.avg_review_score || 0), 0) / windowed.length
        : 0,
      totalReviews: windowed[windowed.length - 1]?.total_reviews ?? 0,
    }
  }, [windowed])

  const closeRate = agg.leads ? (agg.won / agg.leads) * 100 : 0
  const responseRate = agg.reviewsNew ? (agg.reviewsResponded / agg.reviewsNew) * 100 : 0

  const trendData = windowed.map((m) => ({ date: m.date, leads: m.leads_captured }))

  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    leadSources.forEach((l) => {
      counts[l.source] = (counts[l.source] ?? 0) + 1
    })
    return Object.entries(counts).map(([source, count]) => ({
      source: source as LeadSource,
      count,
    }))
  }, [leadSources])

  const foundation = profile.foundation_score ?? 0
  const original = profile.complexity_score ?? foundation

  return (
    <div className="space-y-6">
      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-2">
          {(['week', 'month', 'quarter'] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                'rounded-pill border px-4 py-1.5 font-mono text-[11px] uppercase tracking-wide transition-colors',
                period === p
                  ? 'border-accent bg-accent text-white'
                  : 'border-border bg-bg-card text-text-secondary hover:border-border-active'
              )}
            >
              {periodLabel[p]}
            </button>
          ))}
        </div>
      </div>

      <section className="rounded-card border border-border bg-bg-card p-6">
        <div className="mb-4 font-mono text-[10px] uppercase tracking-wider text-gold">
          Foundation Score
        </div>
        <div className="flex items-center gap-6">
          <ScoreGauge score={foundation} size={140} />
          <div>
            <div className="font-mono text-xs text-success">
              ↑ from {original} at diagnostic
            </div>
            <div className="mt-1 text-sm text-text-muted">
              Your operating system health — higher is better.
            </div>
          </div>
        </div>
      </section>

      <Section title="Marketing">
        <MetricRow label="Leads captured" value={agg.leads.toString()} />
        <MetricRow label="Cost per lead" value={formatCurrency(agg.cpl)} />
        <MetricRow label="Close rate" value={formatPercent(closeRate, 1)} />
        <MetricRow label="Ad ROAS" value={`${agg.roas.toFixed(2)}x`} />
        <MetricRow label="Ad spend" value={formatCurrency(agg.adSpend)} />
        <MetricRow label="Ad revenue" value={formatCurrency(agg.adRevenue)} />
      </Section>

      <Section title="Operations">
        <MetricRow label="Avg response time" value={formatDuration(Math.round(agg.responseTime))} />
        <MetricRow label="Leads qualified" value={agg.qualified.toString()} />
        <MetricRow label="Leads booked" value={agg.booked.toString()} />
        <MetricRow label="Admin hours saved" value={`${agg.adminHours.toFixed(1)} hrs`} />
      </Section>

      <Section title="Reputation">
        <MetricRow label="Total Google reviews" value={agg.totalReviews.toString()} />
        <MetricRow label="New reviews" value={`+${agg.reviewsNew}`} />
        <MetricRow label="Avg rating" value={`${agg.avgRating.toFixed(2)} ★`} />
        <MetricRow label="Response rate" value={formatPercent(responseRate, 0)} />
      </Section>

      <section>
        <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-gold">
          Foundation Score trend
        </div>
        <div className="rounded-card border border-border bg-bg-card p-4">
          {windowed.some((m) => m.foundation_score) ? (
            <ScoreHistory
              data={windowed
                .filter((m) => m.foundation_score)
                .map((m) => ({ date: m.date, score: m.foundation_score }))}
            />
          ) : (
            <div className="py-8 text-center text-sm text-text-muted">No score history yet.</div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-gold">
          Lead trend
        </div>
        <div className="rounded-card border border-border bg-bg-card p-4">
          {trendData.length > 0 ? (
            <LeadTrend data={trendData} />
          ) : (
            <div className="py-8 text-center text-sm text-text-muted">No data yet.</div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-gold">
          Source breakdown
        </div>
        <div className="rounded-card border border-border bg-bg-card p-4">
          {sourceCounts.length > 0 ? (
            <SourceBreakdown data={sourceCounts} />
          ) : (
            <div className="py-8 text-center text-sm text-text-muted">No leads yet.</div>
          )}
        </div>
      </section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-gold">{title}</div>
      <div className="rounded-card border border-border bg-bg-card divide-y divide-border">
        {children}
      </div>
    </section>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="font-mono text-sm text-text-primary">{value}</span>
    </div>
  )
}
