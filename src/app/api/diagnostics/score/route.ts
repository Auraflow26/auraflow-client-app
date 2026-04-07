// POST /api/diagnostics/score — Internal: score a full 163-point dataset
// Requires auth. Called by advisors or n8n after collecting all data points.

import { createClient } from '@/lib/supabase/server'
import { calculateFoundationScore, calculateComplexityScore, scoreDimensions } from '@/lib/scoring/foundation-score'
import { analyzeGaps, suggestPricing } from '@/lib/scoring/gap-analyzer'
import type { Vertical, SizeBand } from '@/lib/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { raw_data, vertical, size_band, client_id, save = false } = await request.json()

    if (!raw_data || !vertical) {
      return Response.json({ error: 'raw_data and vertical are required' }, { status: 400 })
    }

    const v = vertical as Vertical
    const foundationScore = calculateFoundationScore(raw_data, v)
    const complexityScore = calculateComplexityScore(raw_data)
    const dimensionScores = scoreDimensions(raw_data)
    const { break_points, gap_analysis } = analyzeGaps(raw_data)
    const totalGap = gap_analysis.reduce((sum, g) => sum + g.monthly_value, 0)
    const pricing = suggestPricing(totalGap)

    const result = {
      foundation_score: foundationScore,
      complexity_score: complexityScore,
      dimension_scores: dimensionScores,
      break_points,
      gap_analysis,
      suggested_setup_fee: pricing.setup_fee,
      suggested_monthly_fee: pricing.monthly_fee,
      total_annual_value: pricing.annual_value,
    }

    // Optionally save to diagnostic_results
    if (save && client_id) {
      await supabase.from('diagnostic_results').insert({
        client_id,
        diagnostic_type: 'full_diagnostic',
        vertical: v,
        company_size_band: (size_band as SizeBand) ?? 'small',
        ...result,
        raw_data,
        recommendations: [],
        competitor_comparison: [],
        analyzed_at: new Date().toISOString(),
        analyst: user.email ?? 'automated',
        version: '1.0',
      })
    }

    return Response.json(result)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Scoring failed'
    return Response.json({ error: msg }, { status: 500 })
  }
}
