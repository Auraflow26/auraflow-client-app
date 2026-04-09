'use client'

import { useEffect, useRef } from 'react'
import { timeAgo } from '@/lib/utils'
import { AGENTS } from '@/lib/types'
import type { AgentActivity, AgentName } from '@/lib/types'

const statusDotColor: Record<string, string> = {
  completed: '#10b981',
  pending_approval: '#8b5cf6',
  failed: '#ef4444',
  in_progress: '#f59e0b',
}

interface Props {
  agentName: AgentName
  activities: AgentActivity[]
  isLive: boolean
}

export function AgentLogStream({ agentName, activities, isLive }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const agent = AGENTS.find((a) => a.name === agentName)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activities.length])

  const filtered = activities
    .filter((a) => a.agent_name === agentName)
    .slice(0, 50)

  return (
    <div className="mt-3 rounded-input border border-border bg-bg-secondary">
      {/* Terminal header */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-danger/60" />
          <span className="h-2 w-2 rounded-full bg-warning/60" />
          <span className="h-2 w-2 rounded-full bg-success/60" />
        </div>
        <span className="font-mono text-[10px] text-text-dim">
          {agent?.display_name ?? agentName} — live log
        </span>
        {isLive && (
          <span className="ml-auto flex items-center gap-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            <span className="font-mono text-[9px] uppercase text-success">live</span>
          </span>
        )}
      </div>

      {/* Log entries */}
      <div ref={scrollRef} className="max-h-64 overflow-y-auto px-3 py-2">
        {filtered.length === 0 ? (
          <div className="py-4 text-center font-mono text-xs text-text-dim">
            No activity recorded yet.
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((a) => (
              <div key={a.id} className="flex items-start gap-2">
                <span
                  className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: statusDotColor[a.status] ?? '#7c7291' }}
                />
                <div className="min-w-0 flex-1 font-mono text-[11px]">
                  <span className="text-text-dim">{timeAgo(a.created_at)}</span>
                  {' '}
                  <span className="text-text-primary">{a.action}</span>
                  {a.details && (
                    <span className="text-text-muted"> — {a.details}</span>
                  )}
                  {a.status === 'failed' && (
                    <span className="ml-1 text-danger">[FAILED]</span>
                  )}
                  {a.requires_approval && a.status === 'pending_approval' && (
                    <span className="ml-1 text-accent-light">[AWAITING APPROVAL]</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
