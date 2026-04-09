'use client'

import { useEffect } from 'react'
import { AgentStatusCard } from '@/components/ui/AgentStatusCard'
import { AgentLogStream } from './AgentLogStream'
import { ActivityItem } from '@/components/ui/ActivityItem'
import { useStore } from '@/lib/store'
import { AGENTS, type AgentActivity, type AgentName } from '@/lib/types'

interface Props {
  activity: AgentActivity[]
  agentStatuses: {
    name: AgentName
    status: 'active' | 'idle' | 'error'
    metric: string
    lastHeartbeat: string | null
  }[]
}

export function AgentsView({ activity: initialActivity, agentStatuses }: Props) {
  const realtimeActivity = useStore((s) => s.activity)
  const setActivity = useStore((s) => s.setActivity)
  const selectedAgent = useStore((s) => s.selectedAgent)
  const setSelectedAgent = useStore((s) => s.setSelectedAgent)

  useEffect(() => {
    setActivity(initialActivity)
  }, [initialActivity, setActivity])

  const activity = realtimeActivity.length ? realtimeActivity : initialActivity

  function handleToggle(name: AgentName) {
    setSelectedAgent(selectedAgent === name ? null : name)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {AGENTS.map((a) => {
          const agentStatus = agentStatuses.find((s) => s.name === a.name)
          const isExpanded = selectedAgent === a.name
          const hoursSince = agentStatus?.lastHeartbeat
            ? (Date.now() - new Date(agentStatus.lastHeartbeat).getTime()) / 3600000
            : Infinity

          return (
            <div key={a.name}>
              <AgentStatusCard
                config={a}
                status={agentStatus?.status ?? 'idle'}
                metric={agentStatus?.metric ?? 'No activity yet'}
                lastHeartbeat={agentStatus?.lastHeartbeat ?? null}
                expanded={isExpanded}
                onClick={() => handleToggle(a.name)}
              />
              {isExpanded && (
                <AgentLogStream
                  agentName={a.name}
                  activities={activity}
                  isLive={hoursSince < 6}
                />
              )}
            </div>
          )
        })}
      </div>

      <section>
        <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-gold">
          All recent activity
        </div>
        <div className="rounded-card border border-border bg-bg-card px-4">
          {activity.slice(0, 15).map((a) => (
            <ActivityItem key={a.id} item={a} />
          ))}
          {activity.length === 0 && (
            <div className="py-6 text-center text-sm text-text-muted">No activity yet.</div>
          )}
        </div>
      </section>
    </div>
  )
}
