// PATCH /api/leads/[id]
// Update a lead's status — called from the leads list quick-advance
// Side effect: logs to agent_activity so it shows in the live feed

import { createClient } from '@/lib/supabase/server'
import type { ClientProfile, LeadStatus } from '@/lib/types'

export const runtime = 'nodejs'

const VALID_STATUSES: LeadStatus[] = ['new', 'qualified', 'contacted', 'booked', 'won', 'lost']

const STATUS_TIMESTAMPS: Partial<Record<LeadStatus, string>> = {
  qualified: 'qualified_at',
  booked:    'booked_at',
  won:       'won_at',
  lost:      'lost_at',
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('client_profiles')
      .select('client_id')
      .eq('user_id', user.id)
      .single<Pick<ClientProfile, 'client_id'>>()
    if (!profile) return Response.json({ error: 'No profile' }, { status: 404 })

    const { status, note } = await request.json()

    if (!status || !VALID_STATUSES.includes(status)) {
      return Response.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Build update payload — include timestamp for status milestones
    const now = new Date().toISOString()
    const updates: Record<string, unknown> = {
      status,
      updated_at: now,
    }
    const tsField = STATUS_TIMESTAMPS[status as LeadStatus]
    if (tsField) updates[tsField] = now
    if (status === 'lost' && note) updates.lost_reason = note

    const { data: lead, error } = await supabase
      .from('lead_interactions')
      .update(updates)
      .eq('id', params.id)
      .eq('client_id', profile.client_id) // RLS enforced at query level too
      .select('id, lead_name, estimated_value')
      .single()

    if (error || !lead) {
      return Response.json({ error: 'Lead not found or update failed' }, { status: 404 })
    }

    // Log to agent_activity (shows in live feed)
    void supabase.from('agent_activity').insert({
      client_id: profile.client_id,
      agent_name: 'cyrus',
      action: `Lead status updated to ${status}`,
      details: `${lead.lead_name} · $${lead.estimated_value}${note ? ` · ${note}` : ''}`,
      category: 'lead',
      status: 'completed',
      requires_approval: false,
      metadata: { lead_id: lead.id, old_status: null, new_status: status },
    })

    return Response.json({ status: 'ok', lead })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
