// POST /api/push/send (internal — called by webhook routes, not browser)
// Sends a web push notification to all subscriptions for a client
// Validates WEBHOOK_SECRET so only server-to-server calls can use this

import webpush from 'web-push'
import { createServiceClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'

type PushKeys = { p256dh: string; auth: string }

interface PushSubscriptionRow {
  endpoint: string
  keys: PushKeys
}

export async function POST(request: Request) {
  const auth = request.headers.get('Authorization') ?? ''
  const secret = process.env.WEBHOOK_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const vapidPublic = process.env.VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidEmail = process.env.VAPID_EMAIL ?? 'mailto:support@auraflowusa.com'

  if (!vapidPublic || !vapidPrivate) {
    return Response.json({ error: 'VAPID keys not configured' }, { status: 500 })
  }

  webpush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate)

  try {
    const { client_id, title, body, icon, url } = await request.json()

    if (!client_id || !title) {
      return Response.json({ error: 'Missing required fields: client_id, title' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('endpoint, keys')
      .eq('client_id', client_id)
      .returns<PushSubscriptionRow[]>()

    if (!subscriptions?.length) {
      return Response.json({ status: 'no_subscribers', sent: 0 })
    }

    const payload = JSON.stringify({
      title,
      body: body ?? '',
      icon: icon ?? '/icons/icon-192x192.png',
      url: url ?? '/',
    })

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          payload
        ).catch(async (err) => {
          // 410 = subscription expired — clean it up
          if (err?.statusCode === 410) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint)
          }
          throw err
        })
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    return Response.json({ status: 'ok', sent, total: subscriptions.length })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
