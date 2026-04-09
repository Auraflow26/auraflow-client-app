'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface DataCardMetric {
  label: string
  value: string | number
  trend?: number
}

interface DataCardAction {
  label: string
  action: string
  payload?: Record<string, unknown>
}

export interface ChatDataCardData {
  title: string
  metrics: DataCardMetric[]
  actions?: DataCardAction[]
}

interface Props {
  data: ChatDataCardData
  onAction?: (action: string, payload?: Record<string, unknown>) => void
}

export function ChatDataCard({ data, onAction }: Props) {
  return (
    <div className="mt-3 rounded-input border border-border bg-bg-elevated p-3">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-gold">
        {data.title}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {data.metrics.map((m, i) => (
          <div key={i} className="rounded-lg bg-bg-card p-2">
            <div className="font-mono text-[9px] uppercase tracking-wider text-text-dim">
              {m.label}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-base font-semibold text-text-primary">
                {m.value}
              </span>
              {m.trend != null && (
                <span className="flex items-center gap-0.5 font-mono text-[10px]">
                  {m.trend > 0 ? (
                    <TrendingUp className="h-3 w-3 text-success" />
                  ) : m.trend < 0 ? (
                    <TrendingDown className="h-3 w-3 text-danger" />
                  ) : (
                    <Minus className="h-3 w-3 text-text-dim" />
                  )}
                  <span className={m.trend > 0 ? 'text-success' : m.trend < 0 ? 'text-danger' : 'text-text-dim'}>
                    {Math.abs(m.trend).toFixed(0)}%
                  </span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {data.actions && data.actions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {data.actions.map((a, i) => (
            <button
              key={i}
              onClick={() => onAction?.(a.action, a.payload)}
              className="rounded-pill bg-accent/15 px-2.5 py-1 font-mono text-[10px] font-medium text-accent-bright transition-colors hover:bg-accent/25"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
