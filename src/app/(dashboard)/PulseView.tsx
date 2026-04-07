'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'
import { ActivityItem } from '@/components/ui/ActivityItem'
import { useStore } from '@/lib/store'
import { formatCurrency, formatDuration } from '@/lib/utils'
import type { AgentActivity, DailyMetrics } from '@/lib/types'

interface Props {
  metrics: DailyMetrics | null
  activity: AgentActivity[]
}

export function PulseView({ metrics, activity: initialActivity }: Props) {
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

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-gold">Today</div>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Leads Today"
            value={leadsToday}
            accent={leadsToday > 0 ? 'success' : 'default'}
          />
          <MetricCard
            label="Avg Response"
            value={responseTime != null ? formatDuration(responseTime) : '—'}
            accent={responseTime != null && responseTime < 60 ? 'success' : 'default'}
          />
          <MetricCard label="Pipeline" value={formatCurrency(pipelineValue, true)} accent="accent" />
          <MetricCard label="Reviews" value={reviews} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="font-mono text-[10px] uppercase tracking-wider text-gold">Activity</div>
          <Link href="/agents" className="font-mono text-[10px] uppercase text-accent-bright hover:text-accent-light">
            View all
          </Link>
        </div>
        <div className="rounded-card border border-border bg-bg-card px-4">
          {activity.length === 0 ? (
            <div className="py-6 text-center text-sm text-text-muted">No activity yet.</div>
          ) : (
            activity.slice(0, 6).map((a) => <ActivityItem key={a.id} item={a} />)
          )}
        </div>
      </section>

      <section>
        <Link
          href="/chat"
          className="flex items-center gap-3 rounded-card border border-border bg-bg-card px-4 py-3 transition-colors hover:border-border-active"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-glow text-accent-bright">
            <MessageSquare size={16} />
          </div>
          <span className="flex-1 text-sm text-text-muted">Ask about your business…</span>
        </Link>
      </section>
    </div>
  )
}
