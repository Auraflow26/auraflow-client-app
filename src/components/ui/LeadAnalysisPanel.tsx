'use client'

import { useState } from 'react'
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { scoreColor } from '@/lib/utils'
import type { LeadAnalysis } from '@/lib/intelligence/types'

const URGENCY_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  urgent:     { label: 'Urgent',      color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  follow_up:  { label: 'Follow Up',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  standard:   { label: 'Standard',    color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
}

export function LeadAnalysisPanel({ analysis }: { analysis: LeadAnalysis }) {
  const [copied, setCopied] = useState(false)
  const [replyExpanded, setReplyExpanded] = useState(false)

  const urgency = URGENCY_STYLES[analysis.urgency ?? 'standard'] ?? URGENCY_STYLES.standard
  const color = scoreColor(analysis.intent_score ?? 0)
  const signals: string[] = Array.isArray(analysis.intent_signals)
    ? (analysis.intent_signals as string[])
    : []

  function copyReply() {
    if (!analysis.suggested_reply) return
    navigator.clipboard.writeText(analysis.suggested_reply).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <section>
      <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-gold">
        AI Intent Analysis
      </div>
      <div className="rounded-card border border-border bg-bg-card p-4 space-y-4">

        {/* Intent score + urgency */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-text-muted mb-1">Intent Score</div>
            <div className="font-mono text-3xl font-semibold" style={{ color }}>
              {analysis.intent_score ?? '–'}
              <span className="text-sm font-normal text-text-muted">/100</span>
            </div>
          </div>
          <span
            className="rounded-pill px-3 py-1 font-mono text-[11px] font-medium"
            style={{ color: urgency.color, backgroundColor: urgency.bg, border: `1px solid ${urgency.color}40` }}
          >
            {urgency.label}
          </span>
        </div>

        {/* Summary */}
        {analysis.analysis_summary && (
          <p className="text-sm text-text-secondary leading-relaxed">
            {analysis.analysis_summary}
          </p>
        )}

        {/* Intent signals */}
        {signals.length > 0 && (
          <div>
            <div className="mb-2 text-[10px] font-mono uppercase tracking-wider text-text-muted">
              Intent Signals
            </div>
            <div className="flex flex-wrap gap-1.5">
              {signals.map((signal, i) => (
                <span
                  key={i}
                  className="rounded-pill border border-border-active px-2.5 py-0.5 font-mono text-[11px] text-accent-bright"
                  style={{ borderColor: 'rgba(139,92,246,0.35)' }}
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Suggested reply */}
        {analysis.suggested_reply && (
          <div>
            <button
              onClick={() => setReplyExpanded(v => !v)}
              className="flex w-full items-center justify-between text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2"
            >
              <span>Suggested Reply</span>
              {replyExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {replyExpanded && (
              <div className="relative">
                <p className="rounded-lg border border-border bg-bg-secondary p-3 text-sm text-text-secondary leading-relaxed pr-10">
                  {analysis.suggested_reply}
                </p>
                <button
                  onClick={copyReply}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-muted hover:border-border-active hover:text-accent-bright transition-colors"
                >
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
