// POST /api/webhooks/agent
// Called by any n8n workflow on completion
// Inserts into agent_activity — shows in live agent log stream

import { createServiceClient } from '@/lib/supabase/service'
import type { AgentName, ActivityCategory, ActivityStatus } from '@/lib/types'

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
      agent_name,
      action,
      details,
      category,
      status,
      requires_approval,
      metadata,
    } = body

    if (!client_id || !agent_name || !action) {
      return Response.json({ error: 'Missing required fields: client_id, agent_name, action' }, { status: 400 })
    }

    const validAgents: AgentName[] = ['cyrus', 'maven', 'orion', 'atlas', 'apex', 'nova']
    if (!validAgents.includes(agent_name)) {
      return Response.json({ error: `Invalid agent_name. Must be one of: ${validAgents.join(', ')}` }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('agent_activity')
      .insert({
        client_id,
        agent_name: agent_name as AgentName,
        action,
        details: details ?? null,
        category: (category ?? 'system') as ActivityCategory,
        status: (status ?? 'completed') as ActivityStatus,
        requires_approval: requires_approval ?? false,
        metadata: metadata ?? {},
      })
      .select('id')
      .single()

    if (error) {
      console.error('Agent activity insert error:', error)
      return Response.json({ error: 'Failed to insert activity' }, { status: 500 })
    }

    return Response.json({ status: 'ok', activity_id: data.id }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('Webhook /agent error:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
