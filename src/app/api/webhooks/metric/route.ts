// POST /api/webhooks/metric
// Called by n8n Metrics Sync workflow
// Upserts a daily_metrics row for the given client and date

import { createServiceClient } from '@/lib/supabase/service'

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
    const { client_id, date, ...metrics } = body

    if (!client_id || !date) {
      return Response.json({ error: 'Missing required fields: client_id, date' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('daily_metrics')
      .upsert(
        { client_id, date, ...metrics },
        { onConflict: 'client_id,date' }
      )

    if (error) {
      console.error('Metric upsert error:', error)
      return Response.json({ error: 'Failed to upsert metric' }, { status: 500 })
    }

    // Log agent activity — metrics synced
    await supabase.from('agent_activity').insert({
      client_id,
      agent_name: 'atlas',
      action: `Daily metrics synced for ${date}`,
      details: `Leads: ${metrics.leads_captured ?? 0} · Pipeline: $${metrics.pipeline_value ?? 0}`,
      category: 'system',
      status: 'completed',
      requires_approval: false,
      metadata: { date },
    })

    return Response.json({ status: 'ok' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('Webhook /metric error:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
