'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { MessageSquare, TrendingUp } from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'
import { ActivityItem } from '@/components/ui/ActivityItem'
import { useStore } from '@/lib/store'
import { formatCurrency, formatDuration } from '@/lib/utils'
import type { AgentActivity, DailyMetrics } from '@/lib/types'

interface Props {
  metrics: DailyMetrics | null
  prevMetrics: DailyMetrics | null
  activity: AgentActivity[]
}

function pctChange(current: number | null | undefined, prev: number | null | undefined): number | undefined {
  if (!prev || prev === 0 || current == null) return undefined
  return ((current - prev) / prev) * 100
}

export function PulseView({ metrics, prevMetrics, activity: initialActivity }: Props) {
  const realtimeActivity = useStore((s) => s.activity)
  const setActivity = useStore((s) => s.setActivity)

  useEffect(() => {
    setActivity(initialActivity)
  }, [initialActivity, setActivity])

  const activity = realtimeActivity.length ? realtimeActivity : initialActivity

  const leadsToday = metrics?.leads_captured ?? 0
  const responseTime = metrics?.avg_response_time_sec ?? null
  const pipelineValue = metrics?.pipeline_value ?? 0
  const reviews = metrics?.total_reviews ?? 0

  const leadsTrend = pctChange(leadsToday, prevMetrics?.leads_captured)
  const responseTrend = responseTime != null && prevMetrics?.avg_response_time_sec
    ? ((prevMetrics.avg_response_time_sec - responseTime) / prevMetrics.avg_response_time_sec) * 100
    : undefined
  const pipelineTrend = pctChange(pipelineValue, prevMetrics?.pipeline_value)
  const reviewsTrend = pctChange(reviews, prevMetrics?.total_reviews)

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-gold">Today</div>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Leads Today"
            value={leadsToday}
            trend={leadsTrend}
            accent={leadsToday > 0 ? 'success' : 'default'}
            subtext="vs yesterday"
          />
          <MetricCard
            label="Avg Response"
            value={responseTime != null ? formatDuration(responseTime) : '—'}
            trend={responseTrend}
            accent={responseTime != null && responseTime < 60 ? 'success' : 'default'}
            subtext={responseTrend != null ? 'vs yesterday' : undefined}
          />
          <MetricCard
            label="Pipeline"
            value={formatCurrency(pipelineValue, true)}
            trend={pipelineTrend}
            accent="accent"
            subtext={pipelineTrend != null ? 'vs yesterday' : undefined}
          />
          <MetricCard
            label="Reviews"
            value={reviews}
            trend={reviewsTrend}
            subtext={reviewsTrend != null ? 'vs yesterday' : undefined}
          />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="font-mono text-[10px] uppercase tracking-wider text-gold">Agent Activity</div>
          <Link href="/agents" className="font-mono text-[10px] uppercase text-accent-bright hover:text-accent-light">
            View all
          </Link>
        </div>
        <div className="rounded-card border border-border bg-bg-card px-4">
          {activity.length === 0 ? (
            <div className="py-6 text-center">
              <TrendingUp size={20} className="mx-auto mb-2 text-text-dim" />
              <p className="text-sm text-text-muted">Agents are running. Activity will appear here.</p>
            </div>
          ) : (
            activity.slice(0, 6).map((a) => <ActivityItem key={a.id} item={a} />)
          )}
        </div>
      </section>

      <section>
        <Link
          href="/chat"
          className="flex items-center gap-3 rounded-card border border-border bg-bg-card px-4 py-3.5 transition-colors hover:border-border-active"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-glow text-accent-bright">
            <MessageSquare size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-text-primary">Ask AuraFlow Intelligence</div>
            <div className="text-xs text-text-muted">Grounded in your real data</div>
          </div>
          <div className="h-2 w-2 rounded-full bg-success" />
        </Link>
      </section>
    </div>
  )
}
