// POST /api/diagnostics/report — Generate a diagnostic report via Claude API
// Requires auth. Takes a diagnostic_result_id and returns formatted HTML report.

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { DiagnosticResult } from '@/lib/types'
import { DIMENSION_LABELS } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { diagnostic_result_id } = await request.json()
    if (!diagnostic_result_id) {
      return Response.json({ error: 'diagnostic_result_id is required' }, { status: 400 })
    }

    const { data: result } = await supabase
      .from('diagnostic_results')
      .select('*')
      .eq('id', diagnostic_result_id)
      .single<DiagnosticResult>()

    if (!result) return Response.json({ error: 'Diagnostic result not found' }, { status: 404 })

    const topGaps = result.gap_analysis?.slice(0, 5) ?? []
    const topBreaks = result.break_points?.slice(0, 5) ?? []
    const totalGapValue = topGaps.reduce((s, g) => s + g.monthly_value, 0)

    const prompt = `You are AuraFlow's diagnostic report writer. Generate a professional, compelling diagnostic report.

DIAGNOSTIC DATA:
- Vertical: ${result.vertical}
- Company Size: ${result.company_size_band}
- Foundation Score: ${result.foundation_score}/100
- Complexity Score: ${result.complexity_score}/40

DIMENSION SCORES:
${Object.entries(result.dimension_scores ?? {})
  .map(([k, v]) => `- ${DIMENSION_LABELS[k as keyof typeof DIMENSION_LABELS] ?? k}: ${Math.round(Number(v))}/100`)
  .join('\n')}

TOP BREAK POINTS:
${topBreaks.map((b, i) => `${i + 1}. [${b.severity.toUpperCase()}] ${b.description} — $${b.monthly_impact.toLocaleString()}/mo impact`).join('\n')}

GAP ANALYSIS:
${topGaps.map((g, i) => `${i + 1}. ${g.gap}: ${g.current_state} → ${g.target_state} ($${g.monthly_value.toLocaleString()}/mo)`).join('\n')}

TOTAL MONTHLY GAP VALUE: $${totalGapValue.toLocaleString()}
SUGGESTED MONTHLY FEE: $${result.suggested_monthly_fee?.toLocaleString()}
SUGGESTED SETUP FEE: $${result.suggested_setup_fee?.toLocaleString()}

Write a professional 3-section report:
1. EXECUTIVE SUMMARY (2 paragraphs — what we found, what it means for the business)
2. CRITICAL FINDINGS (expand each break point with context and business impact)
3. RECOMMENDED PATH FORWARD (3-5 specific actions AuraFlow will take)

Format as clean HTML with inline styles using these colors:
- Background: #030305, Cards: #0c0a12, Text: #faf5ff, Accent: #8b5cf6, Gold: #d4af37
- Success: #10b981, Danger: #ef4444, Warning: #f59e0b
- Font: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

Be direct, data-driven, and confident. Reference the specific numbers. This is a $500-$1,500 report.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const reportHtml = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')

    // Save back to diagnostic_results
    await supabase
      .from('diagnostic_results')
      .update({
        report_generated_at: new Date().toISOString(),
      })
      .eq('id', diagnostic_result_id)

    return Response.json({ report_html: reportHtml })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Report generation failed'
    return Response.json({ error: msg }, { status: 500 })
  }
}
