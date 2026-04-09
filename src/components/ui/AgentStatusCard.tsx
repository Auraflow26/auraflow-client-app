import { ChevronDown, ChevronRight } from 'lucide-react'
import { AgentConfig } from '@/lib/types'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/utils'

interface AgentStatusCardProps {
  config: AgentConfig
  status: 'active' | 'idle' | 'error'
  metric?: string
  lastHeartbeat?: string | null
  expanded?: boolean
  onClick?: () => void
}

const statusDot = {
  active: '#10b981',
  idle: '#f59e0b',
  error: '#ef4444',
}

const statusLabel = {
  active: 'Active',
  idle: 'Idle',
  error: 'Error',
}

export function AgentStatusCard({ config, status, metric, lastHeartbeat, expanded, onClick }: AgentStatusCardProps) {
  const Chevron = expanded ? ChevronDown : ChevronRight
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-bg-card p-4 transition-colors hover:border-border-active',
        onClick && 'cursor-pointer',
        expanded && 'border-border-active'
      )}
      onClick={onClick}
      role={onClick ? 'button' : 'presentation'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold text-white"
          style={{ backgroundColor: config.color }}
        >
          {config.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-text-primary">{config.display_name}</h3>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusDot[status] }} />
            <span className="font-mono text-[10px] uppercase text-text-muted">{statusLabel[status]}</span>
          </div>
          <div className="mt-0.5 text-xs text-text-muted">{config.role}</div>
        </div>
        {onClick && (
          <Chevron className="mt-1 h-4 w-4 flex-shrink-0 text-text-dim" />
        )}
      </div>
      {metric && (
        <div className="mt-3 font-mono text-xs text-text-secondary">{metric}</div>
      )}
      {lastHeartbeat && (
        <div className="mt-1 font-mono text-[10px] text-text-muted">
          heartbeat {timeAgo(lastHeartbeat)}
        </div>
      )}
    </div>
  )
}
