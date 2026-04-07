import Link from 'next/link'
import { Phone } from 'lucide-react'
import { Lead, LEAD_SOURCES } from '@/lib/types'
import { Badge } from './Badge'
import { formatCurrency, leadScoreBadge, timeAgo } from '@/lib/utils'

export function LeadCard({ lead }: { lead: Lead }) {
  const source = LEAD_SOURCES[lead.source]
  const score = leadScoreBadge(lead.lead_score)
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
