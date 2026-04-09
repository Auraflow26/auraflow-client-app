// POST /api/webhooks/notification
// Called by n8n to push any alert/notification to a client
// Inserts into notifications table — Realtime pushes to the app

import { createServiceClient } from '@/lib/supabase/service'
import type { NotificationType } from '@/lib/types'

export const runtime = 'nodejs'

function validateSecret(request: Request): boolean {
  const auth = request.headers.get('Authorization') ?? ''
  const secret = process.env.WEBHOOK_SECRET
  if (!secret) return false
  return auth === `Bearer ${secret}`
}

const VALID_TYPES: NotificationType[] = [
  'lead_new', 'lead_hot', 'review_new', 'review_negative',
  'agent_action', 'advisor_message', 'report_ready', 'system_alert',
]

export async function POST(request: Request) {
  if (!validateSecret(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      client_id,
      type,
      severity,
      title,
      body: notifBody,
      action_url,
      metadata,
    } = body

    if (!client_id || !type || !title) {
      return Response.json({ error: 'Missing required fields: client_id, type, title' }, { status: 400 })
    }

    if (!VALID_TYPES.includes(type)) {
      return Response.json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        client_id,
        type,
        severity: severity ?? 'medium',
        title,
        body: notifBody ?? null,
        read: false,
        action_url: action_url ?? null,
        metadata: metadata ?? {},
      })
      .select('id')
      .single()

    if (error) {
      console.error('Notification insert error:', error)
      return Response.json({ error: 'Failed to insert notification' }, { status: 500 })
    }

    return Response.json({ status: 'ok', notification_id: data.id }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('Webhook /notification error:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
