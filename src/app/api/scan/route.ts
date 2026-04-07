// POST /api/scan — Public pre-diagnostic scan
// Rate-limited: 10/hour per IP. Runs in ~15-30 seconds.
// Returns a preliminary Foundation Score + top gaps + competitor preview.

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runLighthouse, lighthouseToDataPoints } from '@/lib/scraping/lighthouse'
import { analyzeWebsite, structureToDataPoints } from '@/lib/scraping/website-analyzer'
import { calculateFoundationScore, calculateComplexityScore } from '@/lib/scoring/foundation-score'
import { analyzeGaps, suggestPricing } from '@/lib/scoring/gap-analyzer'
import type { Vertical, PreScanResult } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 45

const RATE_LIMIT_WINDOW = 3600 // 1 hour in seconds
const RATE_LIMIT_MAX = 10

// Simple in-memory rate limit (replace with Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now() / 1000
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'

  if (!checkRateLimit(ip)) {
    return Response.json(
      { error: 'Rate limit exceeded. Please try again in an hour.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { business_name, website_url, city, state, vertical } = body

    if (!business_name || !website_url) {
      return Response.json(
        { error: 'business_name and website_url are required' },
        { status: 400 }
      )
    }

    // Normalize URL
    const url = website_url.startsWith('http') ? website_url : `https://${website_url}`
    const detectedVertical: Vertical = (vertical as Vertical) ?? 'home_services'

    // Run scans in parallel
    const [lighthouseData, structureData] = await Promise.all([
      runLighthouse(url),
      analyzeWebsite(url),
    ])

    // Merge all raw data points we could collect automatically
    const raw: Record<string, unknown> = {
      D01: true,
      ...(lighthouseData ? lighthouseToDataPoints(lighthouseData) : {}),
      ...(structureData ? structureToDataPoints(structureData) : {}),
    }

    // Calculate scores from the automated data points only
    const foundationScore = calculateFoundationScore(raw, detectedVertical)
    const complexityScore = calculateComplexityScore(raw)

    // Identify gaps from the data we have
    const { break_points, gap_analysis } = analyzeGaps(raw)

    const totalMonthlyGap = gap_analysis.reduce((sum, g) => sum + g.monthly_value, 0)
    const pricing = suggestPricing(totalMonthlyGap)

    // Top 3 gaps for the teaser
    const topGaps = gap_analysis.slice(0, 3).map((g) => ({
      title: g.gap,
      description: g.current_state,
      monthly_value: g.monthly_value,
      severity: break_points.find((b) => b.dimension === g.dimension)?.severity ?? 'medium' as const,
    }))

    // Dimension scores for display
    const dimensionScores = {
      digital_presence: lighthouseData
        ? Math.round((lighthouseData.performance_score + lighthouseData.seo_score) / 2)
        : foundationScore,
      reputation: 0, // need Maps data — shown as "pending" in UI
      advertising: 0,
    }

    // Store scan in history
    const supabase = createClient()
    const { data: scanRecord } = await supabase
      .from('scan_history')
      .insert({
        business_name,
        vertical: detectedVertical,
        website_url: url,
        location: [city, state].filter(Boolean).join(', ') || null,
        scan_data: {
          lighthouse: lighthouseData,
          structure: structureData,
        },
        preliminary_score: foundationScore,
      })
      .select('id')
      .single()

    const result: PreScanResult = {
      business_name,
      website_url: url,
      preliminary_score: foundationScore,
      dimension_scores: dimensionScores,
      top_gaps: topGaps,
      competitor_preview: [], // populated by full diagnostic
      total_monthly_gap: totalMonthlyGap,
      scan_id: scanRecord?.id ?? crypto.randomUUID(),
    }

    return Response.json(result)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Scan failed'
    return Response.json({ error: msg }, { status: 500 })
  }
}
