import { AgentActivity, AGENTS } from '@/lib/types'
import { timeAgo } from '@/lib/utils'

const statusColor: Record<string, string> = {
  completed: '#10b981',
  pending_approval: '#8b5cf6',
  failed: '#ef4444',
  in_progress: '#f59e0b',
}

export function ActivityItem({ item }: { item: AgentActivity }) {
  const agent = AGENTS.find((a) => a.name === item.agent_name)
  return (
    <div className="flex items-start gap-3 border-b border-border py-3 last:border-0">
      <span
        className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
        style={{ backgroundColor: statusColor[item.status] ?? '#7c7291' }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="truncate text-sm text-text-primary">
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: agent?.color }}>
              {agent?.display_name ?? item.agent_name}
            </span>{' '}
            <span>{item.action}</span>
          </div>
          <span className="flex-shrink-0 font-mono text-[10px] text-text-muted">
            {timeAgo(item.created_at)}
          </span>
        </div>
        {item.details && (
          <div className="mt-0.5 truncate text-xs text-text-muted">{item.details}</div>
        )}
      </div>
    </div>
  )
}
