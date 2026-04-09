'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LeadStatus } from '@/lib/types'

const STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'new',       label: 'New',       color: 'text-text-muted' },
  { value: 'qualified', label: 'Qualified',  color: 'text-accent-bright' },
  { value: 'contacted', label: 'Contacted',  color: 'text-warning' },
  { value: 'booked',    label: 'Booked',     color: 'text-success' },
  { value: 'won',       label: 'Won',        color: 'text-success' },
  { value: 'lost',      label: 'Lost',       color: 'text-danger' },
]

interface Props {
  leadId: string
  currentStatus: LeadStatus
}

export function LeadStatusUpdate({ leadId, currentStatus }: Props) {
  const [status, setStatus] = useState<LeadStatus>(currentStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function updateStatus(next: LeadStatus) {
    if (next === status || loading) return
    setLoading(true)
    setStatus(next)

    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })

    setLoading(false)
    router.refresh()
  }

  return (
    <div>
      <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-gold">Update Status</div>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => updateStatus(s.value)}
            disabled={loading}
            className={`rounded-pill border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide transition-colors disabled:opacity-50 ${
              status === s.value
                ? 'border-accent bg-accent text-white'
                : 'border-border bg-bg-card text-text-muted hover:border-border-active'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
