// Intelligence Bridge — Prompt Templates
// Separated from logic for iteration without touching orchestration

import type { ClientProfile, DailyMetrics, Lead, AgentActivity } from '@/lib/types'

export function buildDirectivesPrompt(
  profile: ClientProfile,
  todayMetrics: DailyMetrics | null,
  yesterdayMetrics: DailyMetrics | null,
  recentLeads: Lead[],
  recentActivity: AgentActivity[]
): { system: string; user: string } {
  const leadsText = recentLeads.length
    ? recentLeads.map(l =>
        `- ${l.lead_name}: ${l.service_type}, $${l.estimated_value}, score ${l.lead_score}/100, source ${l.source}, status ${l.status}, created ${l.created_at}`
      ).join('\n')
    : '(no recent leads)'

  const activityText = recentActivity.length
    ? recentActivity.slice(0, 10).map(a =>
        `- ${a.agent_name}: ${a.action}${a.details ? ' — ' + a.details : ''} [${a.status}]`
      ).join('\n')
    : '(no recent activity)'

  const todayText = todayMetrics
    ? `Leads: ${todayMetrics.leads_captured}, Won: ${todayMetrics.leads_won}, Response time: ${todayMetrics.avg_response_time_sec}s, Ad spend: $${todayMetrics.ad_spend}, ROAS: ${todayMetrics.ad_roas}x, Reviews: ${todayMetrics.reviews_received} new (${todayMetrics.avg_review_score} avg), Pipeline: $${todayMetrics.pipeline_value}`
    : '(no data for today yet)'

  const yesterdayText = yesterdayMetrics
    ? `Leads: ${yesterdayMetrics.leads_captured}, Won: ${yesterdayMetrics.leads_won}, Response time: ${yesterdayMetrics.avg_response_time_sec}s, Ad spend: $${yesterdayMetrics.ad_spend}, ROAS: ${yesterdayMetrics.ad_roas}x, Reviews: ${yesterdayMetrics.reviews_received} new`
    : '(no data for yesterday)'

  return {
    system: `You are the AuraFlow Intelligence Engine for ${profile.business_name} (${profile.industry ?? 'business'}).

Your job is to generate 3-5 actionable DIRECTIVES based on real data. Each directive should tell the business owner WHAT is happening and provide a concrete ACTION they can take.

DIRECTIVE TYPES: lead, ad, content, review, seo, financial
SEVERITY LEVELS: urgent (needs immediate attention), important (should address today), informational (good to know)
ACTION TYPES: draft_lead_email, optimize_campaign, generate_content, respond_review, boost_seo, view_details

RULES:
- Every directive MUST be grounded in the actual data provided. Never invent data.
- Headlines should be specific and compelling (e.g. "3 high-intent leads waiting" not "You have new leads")
- Bodies should explain the WHY briefly
- Action labels should be 2-3 words (e.g. "Draft Response", "Optimize Now", "View Report")
- Prioritize urgent items first
- Include action_payload with relevant IDs or parameters for executing the action
- Compare today vs yesterday to detect trends worth flagging

Respond with valid JSON only, no markdown.`,

    user: `TODAY'S METRICS:
${todayText}

YESTERDAY'S METRICS:
${yesterdayText}

RECENT LEADS (newest first):
${leadsText}

RECENT AGENT ACTIVITY:
${activityText}

Generate directives now.`
  }
}

export function buildLeadAnalysisPrompt(
  lead: Lead,
  profile: ClientProfile,
  recentLeads: Lead[]
): { system: string; user: string } {
  const contextLeads = recentLeads
    .filter(l => l.id !== lead.id)
    .slice(0, 5)
    .map(l => `- ${l.service_type}, $${l.estimated_value}, score ${l.lead_score}, ${l.status}`)
    .join('\n')

  return {
    system: `You are a lead intelligence analyst for ${profile.business_name} (${profile.industry ?? 'business'}).

Analyze the incoming lead and provide:
1. intent_score (0-100): How likely this lead is to convert
2. intent_signals: Array of specific signals from the lead data (e.g. "high-value service request", "local proximity", "urgent timeline")
3. suggested_reply: A personalized draft response (2-3 sentences, professional but warm)
4. urgency: immediate | today | this_week | low
5. analysis_summary: 1-2 sentence summary of why this lead matters

CONTEXT: Recent leads for comparison are provided so you can calibrate scoring relative to their typical pipeline.

Respond with valid JSON only, no markdown.`,

    user: `NEW LEAD:
- Name: ${lead.lead_name}
- Email: ${lead.lead_email ?? 'not provided'}
- Phone: ${lead.lead_phone ?? 'not provided'}
- Location: ${lead.lead_location ?? 'not provided'}
- Service: ${lead.service_type}
- Estimated value: $${lead.estimated_value}
- Source: ${lead.source}
- Notes: ${lead.notes ?? 'none'}

RECENT PIPELINE FOR CONTEXT:
${contextLeads || '(no recent leads to compare)'}

Analyze this lead now.`
  }
}

export function buildPreferenceExtractionPrompt(
  userMessage: string,
  assistantResponse: string
): { system: string; user: string } {
  return {
    system: `Extract any client preferences, style preferences, or important personal/business context from this conversation turn. Only extract preferences that are explicitly stated or very strongly implied.

Examples of preferences:
- tone_preference: "professional" / "casual" / "direct"
- color_aversion: "hates yellow"
- content_style: "prefers data-heavy posts"
- communication_channel: "prefers SMS over email"
- brand_values: "emphasizes reliability and trust"
- scheduling: "no meetings on Fridays"

If NO preferences are found, return an empty array.

Respond with valid JSON only: { "preferences": [{ "key": string, "value": string, "confidence": number }] }`,

    user: `USER: ${userMessage}
ASSISTANT: ${assistantResponse}`
  }
}
