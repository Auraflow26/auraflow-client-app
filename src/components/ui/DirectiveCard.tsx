'use client'

import { X, Zap, AlertTriangle, Info, ChevronRight } from 'lucide-react'
import type { Directive } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DirectiveCardProps {
  directive: Directive
  onAction: (directive: Directive) => void
  onDismiss: (id: string) => void
}

const severityConfig = {
  urgent: { border: 'border-l-danger', icon: Zap, iconColor: 'text-danger', bg: 'bg-danger/5' },
  important: { border: 'border-l-warning', icon: AlertTriangle, iconColor: 'text-warning', bg: 'bg-warning/5' },
  informational: { border: 'border-l-accent', icon: Info, iconColor: 'text-accent-light', bg: 'bg-accent/5' },
}

export function DirectiveCard({ directive, onAction, onDismiss }: DirectiveCardProps) {
  const config = severityConfig[directive.severity]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'relative rounded-card border border-border border-l-[3px] p-4 transition-colors hover:border-border-active',
        config.border,
        config.bg
      )}
    >
      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(directive.id)}
        className="absolute right-3 top-3 rounded-full p-1 text-text-dim transition-colors hover:bg-bg-elevated hover:text-text-muted"
        aria-label="Dismiss directive"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 h-4 w-4 flex-shrink-0', config.iconColor)} />
        <div className="min-w-0 flex-1 pr-6">
          <div className="text-sm font-medium text-text-primary">{directive.headline}</div>
          {directive.body && (
            <div className="mt-1 text-xs text-text-muted">{directive.body}</div>
          )}
          {directive.action_label && (
            <button
              onClick={() => onAction(directive)}
              className="mt-2.5 inline-flex items-center gap-1 rounded-pill bg-accent/15 px-3 py-1 font-mono text-[11px] font-medium text-accent-bright transition-colors hover:bg-accent/25"
            >
              {directive.action_label}
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
