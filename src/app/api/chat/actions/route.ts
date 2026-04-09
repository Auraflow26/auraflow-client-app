import { createClient } from '@/lib/supabase/server'
import { processNewLead, triggerContentProduction } from '@/lib/intelligence/bridge'
import type { ClientProfile } from '@/lib/types'

export const runtime = 'nodejs'

// POST /api/chat/actions — Execute an action from chat
export async function POST(request: Request) {
  try {
    const { action, payload } = await request.json()
    if (!action) return Response.json({ error: 'Missing action' }, { status: 400 })

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single<ClientProfile>()
    if (!profile) return Response.json({ error: 'No profile' }, { status: 404 })

    switch (action) {
      case 'analyze_lead': {
        const leadId = payload?.lead_id as string
        if (!leadId) return Response.json({ error: 'Missing lead_id' }, { status: 400 })
        const analysis = await processNewLead(supabase, profile.client_id, leadId, profile)
        return Response.json({ result: analysis })
      }

      case 'trigger_content': {
        const brief = payload?.brief as string
        const platform = (payload?.platform as string) ?? 'ig'
        if (!brief) return Response.json({ error: 'Missing brief' }, { status: 400 })
        const result = await triggerContentProduction(
          supabase,
          profile.client_id,
          brief,
          platform as 'ig' | 'ads' | 'email' | 'blog'
        )
        return Response.json({ result })
      }

      case 'update_lead_status': {
        const leadId = payload?.lead_id as string
        const status = payload?.status as string
        if (!leadId || !status) return Response.json({ error: 'Missing lead_id or status' }, { status: 400 })
        await supabase
          .from('lead_interactions')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', leadId)
        return Response.json({ result: { status: 'updated' } })
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
