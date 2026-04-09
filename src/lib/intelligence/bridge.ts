// AuraFlow Intelligence Bridge
// Central nervous system connecting the App UI to Lead Intelligence & Content Engine
// Server-only — never import from Client Components

import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ClientProfile, DailyMetrics, Lead, AgentActivity } from '@/lib/types'
import type { Directive, DirectiveGeneration, LeadAnalysis, LeadAnalysisGeneration, PreferenceExtraction } from './types'
import { buildDirectivesPrompt, buildLeadAnalysisPrompt, buildPreferenceExtractionPrompt } from './prompts'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ═══════════════════════════════════════
// DIRECTIVE GENERATION
// ═══════════════════════════════════════

export async function generateDirectives(
  supabase: SupabaseClient,
  clientId: string,
  profile: ClientProfile
): Promise<Directive[]> {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const [{ data: todayMetrics }, { data: yesterdayMetrics }, { data: leads }, { data: activity }] =
    await Promise.all([
      supabase
        .from('daily_metrics')
        .select('*')
        .eq('client_id', clientId)
        .eq('date', today)
        .single<DailyMetrics>(),
      supabase
        .from('daily_metrics')
        .select('*')
        .eq('client_id', clientId)
        .eq('date', yesterday)
        .single<DailyMetrics>(),
      supabase
        .from('lead_interactions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(15)
        .returns<Lead[]>(),
      supabase
        .from('agent_activity')
        .select('*')
        .eq('client_id', clientId)
        .gte('created_at', new Date(Date.now() - 86400000).toISOString())
        .order('created_at', { ascending: false })
        .limit(15)
        .returns<AgentActivity[]>(),
    ])

  const prompt = buildDirectivesPrompt(
    profile,
    todayMetrics ?? null,
    yesterdayMetrics ?? null,
    leads ?? [],
    activity ?? []
  )

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: prompt.system,
    messages: [{ role: 'user', content: prompt.user }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  let parsed: DirectiveGeneration

  try {
    parsed = JSON.parse(text)
  } catch {
    console.error('Failed to parse directives response:', text)
    return []
  }

  if (!parsed.directives?.length) return []

  // Write directives to Supabase
  const rows = parsed.directives.map(d => ({
    client_id: clientId,
    type: d.type,
    severity: d.severity,
    headline: d.headline,
    body: d.body,
    action_label: d.action_label,
    action_type: d.action_type,
    action_payload: d.action_payload ?? {},
    source_data: {},
    dismissed: false,
    acted_on: false,
  }))

  const { data: inserted } = await supabase
    .from('directives')
    .insert(rows)
    .select()
    .returns<Directive[]>()

  return inserted ?? []
}

// ═══════════════════════════════════════
// LEAD ANALYSIS (Shadow Score)
// ═══════════════════════════════════════

export async function processNewLead(
  supabase: SupabaseClient,
  clientId: string,
  leadId: string,
  profile: ClientProfile
): Promise<LeadAnalysis | null> {
  const [{ data: lead }, { data: recentLeads }] = await Promise.all([
    supabase
      .from('lead_interactions')
      .select('*')
      .eq('id', leadId)
      .single<Lead>(),
    supabase
      .from('lead_interactions')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10)
      .returns<Lead[]>(),
  ])

  if (!lead) return null

  const prompt = buildLeadAnalysisPrompt(lead, profile, recentLeads ?? [])

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: prompt.system,
    messages: [{ role: 'user', content: prompt.user }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  let parsed: LeadAnalysisGeneration

  try {
    parsed = JSON.parse(text)
  } catch {
    console.error('Failed to parse lead analysis response:', text)
    return null
  }

  const { data: inserted } = await supabase
    .from('lead_analyses')
    .insert({
      client_id: clientId,
      lead_id: leadId,
      intent_score: parsed.intent_score,
      intent_signals: parsed.intent_signals,
      suggested_reply: parsed.suggested_reply,
      urgency: parsed.urgency,
      analysis_summary: parsed.analysis_summary,
    })
    .select()
    .single<LeadAnalysis>()

  // Also update the lead's score with the AI-generated intent score
  await supabase
    .from('lead_interactions')
    .update({ lead_score: parsed.intent_score })
    .eq('id', leadId)

  return inserted
}

// ═══════════════════════════════════════
// CONTENT PRODUCTION TRIGGER
// ═══════════════════════════════════════

export async function triggerContentProduction(
  supabase: SupabaseClient,
  clientId: string,
  brief: string,
  platform: 'ig' | 'ads' | 'email' | 'blog'
): Promise<{ status: string; notification_id?: string }> {
  // Insert notification that content production has been triggered
  const { data: notification } = await supabase
    .from('notifications')
    .insert({
      client_id: clientId,
      type: 'system_alert',
      severity: 'medium',
      title: 'Content Production Started',
      body: `Your ${platform} content brief has been submitted: "${brief.slice(0, 80)}..."`,
      action_url: null,
      metadata: { platform, brief },
    })
    .select('id')
    .single()

  // Log as agent activity (Cyrus orchestrating)
  await supabase.from('agent_activity').insert({
    client_id: clientId,
    agent_name: 'cyrus',
    action: `Content production triggered for ${platform}`,
    details: brief.slice(0, 200),
    category: 'workflow',
    status: 'in_progress',
    requires_approval: false,
    metadata: { platform, brief },
  })

  // In production, this would call n8n webhook to trigger the Content Engine
  // For now, we notify and log the trigger
  if (process.env.N8N_WEBHOOK_BASE) {
    try {
      await fetch(`${process.env.N8N_WEBHOOK_BASE}/content-trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, brief, platform }),
      })
    } catch (e) {
      console.error('n8n webhook failed:', e)
    }
  }

  return {
    status: 'triggered',
    notification_id: notification?.id,
  }
}

// ═══════════════════════════════════════
// CHAT CONTEXT MEMORY
// ═══════════════════════════════════════

export async function extractAndSavePreferences(
  supabase: SupabaseClient,
  clientId: string,
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  const prompt = buildPreferenceExtractionPrompt(userMessage, assistantResponse)

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const parsed: PreferenceExtraction = JSON.parse(text)

    if (!parsed.preferences?.length) return

    for (const pref of parsed.preferences) {
      if (pref.confidence < 0.6) continue

      await supabase
        .from('chat_context')
        .upsert(
          {
            client_id: clientId,
            key: pref.key,
            value: pref.value,
            source: 'inferred',
            confidence: pref.confidence,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'client_id,key' }
        )
    }
  } catch (e) {
    // Non-critical — don't block chat flow
    console.error('Preference extraction failed:', e)
  }
}

export async function getClientContext(
  supabase: SupabaseClient,
  clientId: string
): Promise<string> {
  const { data: context } = await supabase
    .from('chat_context')
    .select('key, value')
    .eq('client_id', clientId)
    .order('updated_at', { ascending: false })
    .limit(20)

  if (!context?.length) return ''

  return context
    .map(c => `- ${c.key}: ${c.value}`)
    .join('\n')
}
