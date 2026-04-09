// POST /api/content
// Triggers content production via the Intelligence Bridge
// Called from the Content Engine page in the dashboard

import { createClient } from '@/lib/supabase/server'
import { triggerContentProduction } from '@/lib/intelligence/bridge'
import type { ClientProfile } from '@/lib/types'

export const runtime = 'nodejs'

type Platform = 'ig' | 'ads' | 'email' | 'blog'
const VALID_PLATFORMS: Platform[] = ['ig', 'ads', 'email', 'blog']

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single<ClientProfile>()
    if (!profile) return Response.json({ error: 'No profile' }, { status: 404 })

    const { platform, brief } = await request.json()

    if (!platform || !VALID_PLATFORMS.includes(platform)) {
      return Response.json(
        { error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}` },
        { status: 400 }
      )
    }

    if (!brief || typeof brief !== 'string' || brief.trim().length < 10) {
      return Response.json({ error: 'Brief must be at least 10 characters' }, { status: 400 })
    }

    const result = await triggerContentProduction(
      supabase,
      profile.client_id,
      brief.trim(),
      platform
    )

    return Response.json(result)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
