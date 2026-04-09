// POST /api/admin/onboard
// Creates a new client in Supabase — called from the onboarding generator HTML tool
// Protected by ADMIN_SECRET env var (never exposed to browser)
// Uses service-role client to bypass RLS and write across all tables

import { createServiceClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'

function validateAdmin(request: Request): boolean {
  const auth = request.headers.get('Authorization') ?? ''
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  return auth === `Bearer ${secret}`
}

function generateUUID(): string {
  // Use crypto.randomUUID in Node 19+, fallback for earlier
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

interface HierarchyLayer {
  layer_type: string
  node_name: string
  layer_position: number
  is_active: boolean
}

interface OnboardPayload {
  business_name: string
  contact_name: string
  contact_email: string
  contact_phone?: string
  industry: string
  employee_count: string
  revenue_range: string
  foundation_score: number
  complexity_score: number
  advisor_name?: string
  advisor_email?: string
  primary_source: string
  service_type?: string
  avg_lead_value?: number
  hierarchy_layers: HierarchyLayer[]
}

export async function POST(request: Request) {
  if (!validateAdmin(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body: OnboardPayload = await request.json()

    const {
      business_name,
      contact_name,
      contact_email,
      contact_phone,
      industry,
      employee_count,
      revenue_range,
      foundation_score,
      complexity_score,
      advisor_name,
      advisor_email,
      primary_source,
      service_type,
      avg_lead_value,
      hierarchy_layers,
    } = body

    if (!business_name || !contact_email || !contact_name) {
      return Response.json(
        { error: 'Missing required fields: business_name, contact_name, contact_email' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    const clientId = generateUUID()
    const activeCount = hierarchy_layers.filter(l => l.is_active).length

    // ── 1. Create client record ──────────────────────────
    const { error: clientError } = await supabase
      .from('clients')
      .insert({ id: clientId, name: business_name, created_at: new Date().toISOString() })

    // Non-fatal if clients table has different structure — continue
    if (clientError) {
      console.warn('clients table insert skipped:', clientError.message)
    }

    // ── 2. Create client profile ─────────────────────────
    const { error: profileError } = await supabase
      .from('client_profiles')
      .insert({
        client_id: clientId,
        business_name,
        contact_name,
        contact_email,
        contact_phone: contact_phone ?? null,
        industry,
        employee_count,
        revenue_range,
        foundation_score,
        complexity_score,
        hierarchy_depth: activeCount,
        advisor_name: advisor_name ?? null,
        advisor_email: advisor_email ?? null,
        onboarded_at: new Date().toISOString(),
        // user_id left null — linked after client signs up via magic link
      })

    if (profileError) {
      return Response.json(
        { error: `Failed to create client profile: ${profileError.message}` },
        { status: 500 }
      )
    }

    // ── 3. Seed hierarchy layers ──────────────────────────
    if (hierarchy_layers.length > 0) {
      const nodes = hierarchy_layers.map(l => ({
        client_id: clientId,
        layer_type: l.layer_type,
        layer_position: l.layer_position,
        node_name: l.node_name,
        is_active: l.is_active,
        metadata: {},
      }))

      const { error: hierarchyError } = await supabase
        .from('hierarchy_nodes')
        .insert(nodes)

      if (hierarchyError) {
        console.warn('Hierarchy insert warning:', hierarchyError.message)
      }
    }

    // ── 4. Seed today's initial metrics row ───────────────
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('daily_metrics')
      .insert({
        client_id: clientId,
        date: today,
        pipeline_value: 0,
        foundation_score,
      })
      // Ignore conflict — might already exist
      .select()

    // ── 5. Welcome notification ───────────────────────────
    await supabase.from('notifications').insert({
      client_id: clientId,
      type: 'advisor_message',
      severity: 'medium',
      title: 'Welcome to AuraFlow',
      body: `Your AuraFlow system is live.${advisor_name ? ` Your advisor ${advisor_name} will be in touch shortly.` : ''}`,
      read: false,
      metadata: {
        primary_source,
        service_type,
        avg_lead_value,
      },
    })

    // ── 6. Log initial agent activity ─────────────────────
    await supabase.from('agent_activity').insert({
      client_id: clientId,
      agent_name: 'cyrus',
      action: `Client onboarded: ${business_name}`,
      details: `Industry: ${industry} · Team: ${employee_count} · Foundation Score: ${foundation_score}`,
      category: 'system',
      status: 'completed',
      requires_approval: false,
      metadata: { onboarded_by: 'admin_generator' },
    })

    return Response.json({
      status: 'ok',
      client_id: clientId,
      business_name,
      next_step: `Send magic link to ${contact_email}, then run: UPDATE client_profiles SET user_id = '<auth_uuid>' WHERE client_id = '${clientId}'`,
    }, { status: 201 })

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('/api/admin/onboard error:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
