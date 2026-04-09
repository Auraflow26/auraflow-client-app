// POST /api/webhooks/lead
// Called by n8n Lead Scraper when a new lead is captured
// Upserts to lead_interactions + triggers background AI analysis

import { createServiceClient } from '@/lib/supabase/service'
import { processNewLead } from '@/lib/intelligence/bridge'
import type { ClientProfile, Lead } from '@/lib/types'

export const runtime = 'nodejs'

function validateSecret(request: Request): boolean {
  const auth = request.headers.get('Authorization') ?? ''
  const secret = process.env.WEBHOOK_SECRET
  if (!secret) return false
  return auth === `Bearer ${secret}`
}

export async function POST(request: Request) {
  if (!validateSecret(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      client_id,
      lead_name,
      lead_email,
      lead_phone,
      lead_location,
      source,
      service_type,
      estimated_value,
      notes,
    } = body

    if (!client_id || !lead_name) {
      return Response.json({ error: 'Missing required fields: client_id, lead_name' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Upsert lead (idempotent — n8n may retry)
    const { data: lead, error } = await supabase
      .from('lead_interactions')
      .insert({
        client_id,
        lead_name,
        lead_email: lead_email ?? null,
        lead_phone: lead_phone ?? null,
        lead_location: lead_location ?? null,
        source: source ?? 'direct',
        service_type: service_type ?? 'General',
        estimated_value: estimated_value ?? 0,
        lead_score: 50, // default until AI analysis runs
        status: 'new',
        follow_up_stage: 0,
        follow_up_history: [],
        notes: notes ?? null,
        requires_approval: false,
        metadata: {},
      })
      .select()
      .single<Lead>()

    if (error || !lead) {
      console.error('Lead insert error:', error)
      return Response.json({ error: 'Failed to insert lead' }, { status: 500 })
    }

    // Fetch client profile for AI analysis context
    const { data: profile } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('client_id', client_id)
      .single<ClientProfile>()

    // Log agent activity — lead captured
    await supabase.from('agent_activity').insert({
      client_id,
      agent_name: 'cyrus',
      action: `New lead captured: ${lead_name}`,
      details: `Source: ${source ?? 'direct'} · Service: ${service_type ?? 'General'} · Value: $${estimated_value ?? 0}`,
      category: 'lead',
      status: 'completed',
      requires_approval: false,
      metadata: { lead_id: lead.id },
    })

    // Trigger AI shadow analysis in background (non-blocking)
    if (profile) {
      void processNewLead(supabase, client_id, lead.id, profile).then(async (analysis) => {
        // Push notification if lead is urgent and WEBHOOK_SECRET is set
        if (analysis?.urgency === 'immediate' && process.env.WEBHOOK_SECRET) {
          try {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/push/send`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.WEBHOOK_SECRET}`,
              },
              body: JSON.stringify({
                client_id,
                title: `Urgent Lead: ${lead_name}`,
                body: `High-intent lead requires immediate follow-up · $${estimated_value ?? 0}`,
                url: `/leads/${lead.id}`,
              }),
            })
          } catch {
            // Non-critical
          }
        }
      })
    }

    return Response.json({ status: 'ok', lead_id: lead.id }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('Webhook /lead error:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
