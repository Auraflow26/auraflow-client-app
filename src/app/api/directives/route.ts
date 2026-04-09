import { createClient } from '@/lib/supabase/server'
import { generateDirectives } from '@/lib/intelligence/bridge'
import type { ClientProfile } from '@/lib/types'
import type { Directive } from '@/lib/intelligence/types'

export const runtime = 'nodejs'

// GET /api/directives — Fetch existing or generate fresh directives
export async function GET() {
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

    // Check for recent non-dismissed directives (last 6 hours)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()

    const { data: existing } = await supabase
      .from('directives')
      .select('*')
      .eq('client_id', profile.client_id)
      .eq('dismissed', false)
      .gte('created_at', sixHoursAgo)
      .order('created_at', { ascending: false })
      .limit(10)
      .returns<Directive[]>()

    if (existing && existing.length > 0) {
      return Response.json({ directives: existing, fresh: false })
    }

    // Generate new directives via Intelligence Bridge
    const directives = await generateDirectives(supabase, profile.client_id, profile)
    return Response.json({ directives, fresh: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}

// POST /api/directives — Execute action or dismiss a directive
export async function POST(request: Request) {
  try {
    const { action, directive_id } = await request.json()
    if (!directive_id) return Response.json({ error: 'Missing directive_id' }, { status: 400 })

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    if (action === 'dismiss') {
      await supabase
        .from('directives')
        .update({ dismissed: true })
        .eq('id', directive_id)
      return Response.json({ status: 'dismissed' })
    }

    if (action === 'act') {
      await supabase
        .from('directives')
        .update({ acted_on: true })
        .eq('id', directive_id)
      return Response.json({ status: 'acted' })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
