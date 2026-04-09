// POST /api/push/subscribe
// Receives a PushSubscription object from the browser and stores it for the client
// Called by usePushSubscription hook after permission is granted

import { createClient } from '@/lib/supabase/server'
import type { ClientProfile } from '@/lib/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
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

    const subscription = await request.json()
    const { endpoint, keys } = subscription

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return Response.json({ error: 'Invalid subscription object' }, { status: 400 })
    }

    await supabase
      .from('push_subscriptions')
      .upsert(
        {
          client_id: profile.client_id,
          user_id: user.id,
          endpoint,
          keys: { p256dh: keys.p256dh, auth: keys.auth },
        },
        { onConflict: 'endpoint' }
      )

    return Response.json({ status: 'subscribed' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { endpoint } = await request.json()
    if (!endpoint) return Response.json({ error: 'Missing endpoint' }, { status: 400 })

    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('user_id', user.id)

    return Response.json({ status: 'unsubscribed' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
