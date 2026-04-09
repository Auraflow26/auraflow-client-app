'use client'

import { useState } from 'react'
import { LeadCard } from '@/components/ui/LeadCard'
import { cn } from '@/lib/utils'
import type { Lead, LeadStatus } from '@/lib/types'

type Filter = 'all' | LeadStatus

const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'booked', label: 'Booked' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
]

export function LeadsView({ leads: initialLeads }: { leads: Lead[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [leads, setLeads] = useState<Lead[]>(initialLeads)

  function handleStatusAdvance(id: string, newStatus: LeadStatus) {
    setLeads(prev =>
      prev.map(l => l.id === id ? { ...l, status: newStatus } : l)
    )
  }

  const filtered = filter === 'all' ? leads : leads.filter((l) => l.status === filter)

  return (
    <div className="space-y-4">
      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-2">
          {filters.map((f) => {
            const active = filter === f.key
            return (
              <button
                type="button"
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'rounded-pill border px-4 py-1.5 font-mono text-[11px] uppercase tracking-wide transition-colors',
                  active
                    ? 'border-accent bg-accent text-white'
                    : 'border-border bg-bg-card text-text-secondary hover:border-border-active'
                )}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-card border border-border bg-bg-card p-8 text-center">
          <p className="text-sm text-text-muted">
            No leads yet. Your system is running — they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onStatusAdvance={handleStatusAdvance} />
          ))}
        </div>
      )}
    </div>
  )
}
