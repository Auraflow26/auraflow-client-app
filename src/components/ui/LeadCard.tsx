'use client'

import Link from 'next/link'
import { Phone, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Lead, LEAD_SOURCES, type LeadStatus } from '@/lib/types'
import { Badge } from './Badge'
import { formatCurrency, leadScoreBadge, timeAgo } from '@/lib/utils'

const STATUS_ORDER: LeadStatus[] = ['new', 'qualified', 'booked', 'won']
const STATUS_NEXT_LABEL: Partial<Record<LeadStatus, string>> = {
  new:       'Qualify →',
  qualified: 'Book →',
  booked:    'Mark Won →',
}

export function LeadCard({ lead, onStatusAdvance }: { lead: Lead; onStatusAdvance?: (id: string, newStatus: LeadStatus) => void }) {
  const [advancing, setAdvancing] = useState(false)
  const source = LEAD_SOURCES[lead.source]
  const score = leadScoreBadge(lead.lead_score)

  const currentIdx = STATUS_ORDER.indexOf(lead.status as LeadStatus)
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_ORDER.length - 1
    ? STATUS_ORDER[currentIdx + 1]
    : null
  const nextLabel = lead.status in STATUS_NEXT_LABEL ? STATUS_NEXT_LABEL[lead.status as LeadStatus] : null

  async function advanceStatus() {
    if (!nextStatus || advancing) return
    setAdvancing(true)
    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      onStatusAdvance?.(lead.id, nextStatus)
    } catch {
      // silent — lead detail page still works
    } finally {
      setAdvancing(false)
    }
  }

  return (
    <div className="rounded-card border border-border bg-bg-card p-4 transition-colors hover:border-border-active">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium text-text-primary">{lead.lead_name}</h3>
            <Badge color={score.color} bg={score.bg}>{score.label} · {lead.lead_score}</Badge>
          </div>
          {lead.lead_location && (
            <div className="mt-0.5 text-xs text-text-muted">{lead.lead_location}</div>
          )}
        </div>
        <div className="text-right">
          <div className="font-mono text-sm text-text-primary">{formatCurrency(lead.estimated_value)}</div>
          <div className="mt-0.5 font-mono text-[10px] uppercase text-text-muted">{lead.status}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge color={source.color} bg={`${source.color}20`}>{source.label}</Badge>
          <span className="text-xs text-text-muted">{lead.service_type}</span>
        </div>
        <span className="font-mono text-[10px] text-text-muted">{timeAgo(lead.created_at)}</span>
      </div>

      <div className="mt-3 flex gap-2">
        <Link
          href={`/leads/${lead.id}`}
          className="flex-1 rounded-input border border-border py-2 text-center text-xs font-medium text-text-secondary transition-colors hover:border-border-active hover:text-text-primary"
        >
          View
        </Link>
        {nextLabel && (
          <button
            type="button"
            onClick={advanceStatus}
            disabled={advancing}
            className="flex items-center gap-1 rounded-input border border-border-active px-3 py-2 text-xs font-medium text-accent-bright transition-colors hover:bg-accent hover:text-white disabled:opacity-50"
          >
            {advancing ? '…' : nextLabel}
            {!advancing && <ChevronRight size={12} />}
          </button>
        )}
        {lead.lead_phone && (
          <a
            href={`tel:${lead.lead_phone}`}
            className="flex items-center justify-center gap-1.5 rounded-input bg-accent px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            <Phone size={14} /> Call
          </a>
        )}
      </div>
    </div>
  )
}
