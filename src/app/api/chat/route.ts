import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getClientContext, getConversationSummary, extractAndSavePreferences } from '@/lib/intelligence/bridge'
import type { ClientProfile, DailyMetrics, Lead, AgentActivity, ChatMessage } from '@/lib/types'

export const runtime = 'nodejs'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'Missing message' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single<ClientProfile>()
    if (!profile) return Response.json({ error: 'No profile' }, { status: 404 })

    const thirty = new Date()
    thirty.setDate(thirty.getDate() - 30)
    const thirtyIso = thirty.toISOString()
    const thirtyDate = thirtyIso.split('T')[0]

    const [{ data: metrics }, { data: leads }, { data: activity }, { data: history }] =
      await Promise.all([
        supabase
          .from('daily_metrics')
          .select('*')
          .eq('client_id', profile.client_id)
          .gte('date', thirtyDate)
          .order('date', { ascending: false })
          .returns<DailyMetrics[]>(),
        supabase
          .from('lead_interactions')
          .select('*')
          .eq('client_id', profile.client_id)
          .order('created_at', { ascending: false })
          .limit(10)
          .returns<Lead[]>(),
        supabase
          .from('agent_activity')
          .select('*')
          .eq('client_id', profile.client_id)
          .gte('created_at', thirtyIso)
          .order('created_at', { ascending: false })
          .limit(20)
          .returns<AgentActivity[]>(),
        supabase
          .from('chat_messages')
          .select('*')
          .eq('client_id', profile.client_id)
          .order('created_at', { ascending: true })
          .limit(40)
          .returns<ChatMessage[]>(),
      ])

    const agg = (metrics ?? []).reduce(
      (a, m) => ({
        leads: a.leads + (m.leads_captured || 0),
        won: a.won + (m.leads_won || 0),
        adSpend: a.adSpend + Number(m.ad_spend || 0),
        adRevenue: a.adRevenue + Number(m.ad_revenue || 0),
        responseTimeSum: a.responseTimeSum + (m.avg_response_time_sec || 0),
        responseTimeCount: a.responseTimeCount + (m.avg_response_time_sec ? 1 : 0),
        adminHours: a.adminHours + Number(m.admin_hours_saved || 0),
        reviewsReceived: a.reviewsReceived + (m.reviews_received || 0),
      }),
      { leads: 0, won: 0, adSpend: 0, adRevenue: 0, responseTimeSum: 0, responseTimeCount: 0, adminHours: 0, reviewsReceived: 0 }
    )
    const avgResponse = agg.responseTimeCount
      ? Math.round(agg.responseTimeSum / agg.responseTimeCount)
      : null
    const latestMetric = metrics?.[0]
    const totalReviews = latestMetric?.total_reviews ?? 0
    const avgRating = latestMetric?.avg_review_score ?? null
    const foundationScore = latestMetric?.foundation_score ?? profile.foundation_score

    // Fetch client memory and conversation summary in parallel
    const [clientContext, conversationSummary] = await Promise.all([
      getClientContext(supabase, profile.client_id),
      getConversationSummary(supabase, profile.client_id),
    ])

    const systemPrompt = `You are AuraFlow Intelligence — the dedicated AI advisor for ${profile.business_name}, a ${profile.industry ?? 'business'} with ${profile.employee_count ?? 'an unspecified'} team size.

You have a persistent memory of this client. You remember their preferences, past decisions, and ongoing concerns. Never ask them to repeat something you already know.
${clientContext ? `\n══ WHAT YOU KNOW ABOUT THIS CLIENT ══\n${clientContext}\n` : ''}${conversationSummary ? `\n══ RECENT CONVERSATION CONTEXT ══\n${conversationSummary}\n` : ''}
══ LIVE BUSINESS DATA (last 30 days) ══
Leads captured: ${agg.leads} | Won: ${agg.won} | Close rate: ${agg.leads > 0 ? ((agg.won / agg.leads) * 100).toFixed(1) : 'n/a'}%
Avg response time: ${avgResponse ?? 'n/a'}s | Ad spend: $${agg.adSpend.toFixed(2)} | Ad revenue: $${agg.adRevenue.toFixed(2)} | ROAS: ${agg.adSpend > 0 ? (agg.adRevenue / agg.adSpend).toFixed(2) : 'n/a'}x
Admin hours saved: ${agg.adminHours.toFixed(1)} | Reviews: ${totalReviews} total, avg ${avgRating ?? 'n/a'}★, ${agg.reviewsReceived} new this month
Foundation Score: ${foundationScore ?? 'n/a'}/100

RECENT LEADS:
${(leads ?? []).map((l) => `- ${l.lead_name}: ${l.service_type}, $${l.estimated_value}, score ${l.lead_score}, source ${l.source}, status ${l.status}`).join('\n') || '- (none yet)'}

RECENT AGENT ACTIVITY:
${(activity ?? []).slice(0, 12).map((a) => `- ${a.agent_name}: ${a.action}${a.details ? ' — ' + a.details : ''}`).join('\n') || '- (none yet)'}

RULES:
- You remember this client. Use that memory actively — reference past topics, honor stated preferences.
- Ground every answer in the real data above. Never fabricate numbers.
- If data is missing, say so honestly.
- Responses must be concise — 2-4 short paragraphs max. This is a mobile interface.
- Use plain English. No jargon. Speak like a trusted advisor, not a dashboard.
- Significant changes require advisor approval — note this when relevant.`

    const prior = (history ?? []).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // Stream the response
    const encoder = new TextEncoder()
    let fullText = ''

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const stream = anthropic.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [...prior, { role: 'user', content: message }],
          })

          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              const text = chunk.delta.text
              fullText += text
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ delta: text })}\n\n`)
              )
            }
          }

          // Save both messages after stream completes
          await supabase.from('chat_messages').insert([
            { client_id: profile.client_id, role: 'user', content: message, metadata: {} },
            {
              client_id: profile.client_id,
              role: 'assistant',
              content: fullText || 'I had trouble generating a response. Please try again.',
              metadata: {},
            },
          ])

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))

          // Extract and save client preferences in background (non-blocking)
          if (fullText) {
            extractAndSavePreferences(supabase, profile.client_id, message, fullText).catch(() => {})
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Unknown error'
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
