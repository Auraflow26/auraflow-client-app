// AuraFlow Gap Analyzer
// Identifies break points and calculates monthly dollar value of each gap

import type { BreakPoint, GapItem, DiagnosticDimension } from '@/lib/types'

function num(v: unknown): number {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}
function bool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') return v.toLowerCase() === 'yes' || v === 'true'
  return Boolean(v)
}

export function analyzeGaps(
  raw: Record<string, unknown>
): { break_points: BreakPoint[]; gap_analysis: GapItem[] } {
  const break_points: BreakPoint[] = []
  const gap_analysis: GapItem[] = []

  // ─── LEAD RESPONSE TIME ─────────────────────────────────────────────────
  const responseMin = num(raw.L04)
  if (responseMin > 60) {
    const impact = Math.min(Math.round((responseMin / 15) * 800), 12000)
    break_points.push({
      id: 'bp-lead-response',
      dimension: 'lead_generation',
      data_point_id: 'L04',
      description: `Lead response time is ${responseMin} min — industry best practice is under 5 min`,
      severity: responseMin > 240 ? 'critical' : 'high',
      current_value: `${responseMin} minutes`,
      benchmark_value: '5 minutes',
      monthly_impact: impact,
    })
    gap_analysis.push({
      gap: 'Slow Lead Response',
      dimension: 'lead_generation',
      current_state: `Responding to leads in ${responseMin} minutes on average`,
      target_state: 'Automated response within 5 minutes, 24/7',
      monthly_value: impact,
      value_breakdown: {
        time_savings: Math.round(impact * 0.2),
        revenue_increase: Math.round(impact * 0.7),
        cost_reduction: Math.round(impact * 0.05),
        opportunity_cost: Math.round(impact * 0.05),
      },
    })
  }

  // ─── NO FOLLOW-UP SEQUENCE ──────────────────────────────────────────────
  if (!bool(raw.L14)) {
    break_points.push({
      id: 'bp-no-followup',
      dimension: 'lead_generation',
      data_point_id: 'L14',
      description: 'No automated follow-up sequence — leads go cold after first contact',
      severity: 'critical',
      current_value: false,
      benchmark_value: '5-7 touch sequence',
      monthly_impact: 8400,
    })
    gap_analysis.push({
      gap: 'No Lead Follow-Up System',
      dimension: 'lead_generation',
      current_state: 'Leads receive one response or none at all',
      target_state: '7-touch automated sequence across SMS, email, and call',
      monthly_value: 8400,
      value_breakdown: {
        time_savings: 800,
        revenue_increase: 6600,
        cost_reduction: 400,
        opportunity_cost: 600,
      },
    })
  }

  // ─── NO CONVERSION TRACKING ─────────────────────────────────────────────
  if (num(raw.A01) > 500 && !bool(raw.A04)) {
    const adSpend = num(raw.A01)
    const wastedBudget = Math.round(adSpend * 0.3)
    break_points.push({
      id: 'bp-no-conversion-tracking',
      dimension: 'advertising',
      data_point_id: 'A04',
      description: `Spending $${adSpend}/mo on ads with no conversion tracking`,
      severity: 'critical',
      current_value: false,
      benchmark_value: 'Full conversion tracking on all campaigns',
      monthly_impact: wastedBudget,
    })
    gap_analysis.push({
      gap: 'No Ad Conversion Tracking',
      dimension: 'advertising',
      current_state: `$${adSpend}/mo in ad spend with no attribution data`,
      target_state: 'Full conversion tracking — know exactly which ads generate revenue',
      monthly_value: wastedBudget,
      value_breakdown: {
        time_savings: 0,
        revenue_increase: Math.round(wastedBudget * 0.4),
        cost_reduction: Math.round(wastedBudget * 0.6),
        opportunity_cost: 0,
      },
    })
  }

  // ─── LOW REVIEW RESPONSE RATE ───────────────────────────────────────────
  const responseRate = num(raw.R08)
  if (num(raw.R05) >= 10 && responseRate < 50) {
    const impact = Math.round(1200 + (num(raw.R05) * 8))
    break_points.push({
      id: 'bp-review-response',
      dimension: 'reputation',
      data_point_id: 'R08',
      description: `Only ${responseRate}% of Google reviews receive a response`,
      severity: responseRate < 20 ? 'critical' : 'high',
      current_value: `${responseRate}%`,
      benchmark_value: '90%+',
      monthly_impact: impact,
    })
    gap_analysis.push({
      gap: 'Unmanaged Review Reputation',
      dimension: 'reputation',
      current_state: `${100 - responseRate}% of reviews go unanswered — damaging trust and rankings`,
      target_state: '90%+ response rate with templated, personalized responses within 24 hours',
      monthly_value: impact,
      value_breakdown: {
        time_savings: 300,
        revenue_increase: Math.round(impact * 0.6),
        cost_reduction: 200,
        opportunity_cost: Math.round(impact * 0.3),
      },
    })
  }

  // ─── HIGH MANUAL ADMIN ───────────────────────────────────────────────────
  const adminHrs = num(raw.O03)
  if (adminHrs >= 10) {
    const impact = Math.round(adminHrs * 65)
    break_points.push({
      id: 'bp-manual-admin',
      dimension: 'operations',
      data_point_id: 'O03',
      description: `${adminHrs} hours/week spent on manual data entry and admin tasks`,
      severity: adminHrs >= 20 ? 'high' : 'medium',
      current_value: `${adminHrs} hours/week`,
      benchmark_value: '<3 hours/week',
      monthly_impact: impact,
    })
    gap_analysis.push({
      gap: 'Manual Operations Bottleneck',
      dimension: 'operations',
      current_state: `${adminHrs} hrs/week of manual admin — ${Math.round(adminHrs * 4.3)} hrs/month`,
      target_state: 'Automated workflows reduce admin to under 3 hrs/week',
      monthly_value: impact,
      value_breakdown: {
        time_savings: impact,
        revenue_increase: 0,
        cost_reduction: 0,
        opportunity_cost: 0,
      },
    })
  }

  // ─── DISCONNECTED TOOLS ──────────────────────────────────────────────────
  const tools = num(raw.O01)
  const integrated = num(raw.O02)
  if (tools >= 6 && integrated / tools < 0.5) {
    const disconnected = tools - integrated
    const impact = Math.round(disconnected * 200)
    break_points.push({
      id: 'bp-disconnected-tools',
      dimension: 'operations',
      data_point_id: 'O02',
      description: `${disconnected} of ${tools} tools are disconnected — creating data silos`,
      severity: disconnected >= 8 ? 'high' : 'medium',
      current_value: `${integrated}/${tools} tools integrated`,
      benchmark_value: '80%+ integration rate',
      monthly_impact: impact,
    })
    gap_analysis.push({
      gap: 'Disconnected Tech Stack',
      dimension: 'operations',
      current_state: `${disconnected} tools operating in silos — data entry duplicated across systems`,
      target_state: 'Unified tech stack with automated data flow between all tools',
      monthly_value: impact,
      value_breakdown: {
        time_savings: impact,
        revenue_increase: 0,
        cost_reduction: 0,
        opportunity_cost: 0,
      },
    })
  }

  // ─── OWNER OVERWORK ──────────────────────────────────────────────────────
  const ownerHrs = num(raw.O15)
  if (ownerHrs >= 50) {
    const impact = Math.round((ownerHrs - 40) * 4.3 * 75)
    break_points.push({
      id: 'bp-owner-overwork',
      dimension: 'operations',
      data_point_id: 'O15',
      description: `Owner works ${ownerHrs} hrs/week — business is owner-dependent`,
      severity: ownerHrs >= 60 ? 'critical' : 'high',
      current_value: `${ownerHrs} hours/week`,
      benchmark_value: '40 hours/week',
      monthly_impact: impact,
    })
    gap_analysis.push({
      gap: 'Owner-Dependent Business',
      dimension: 'operations',
      current_state: `Owner working ${ownerHrs} hrs/week — no systems to delegate`,
      target_state: 'Systems and automation reduce owner to 40 hrs/week + strategic work only',
      monthly_value: impact,
      value_breakdown: {
        time_savings: impact,
        revenue_increase: 0,
        cost_reduction: 0,
        opportunity_cost: 0,
      },
    })
  }

  // Sort by monthly impact descending
  break_points.sort((a, b) => b.monthly_impact - a.monthly_impact)
  gap_analysis.sort((a, b) => b.monthly_value - a.monthly_value)

  return { break_points, gap_analysis }
}

export function suggestPricing(
  totalMonthlyGap: number
): { setup_fee: number; monthly_fee: number; annual_value: number } {
  // AuraFlow price = ~25% of total monthly gap value
  const monthly_fee = Math.round((totalMonthlyGap * 0.25) / 100) * 100
  const setup_fee = Math.round(monthly_fee * 1.5 / 100) * 100
  return {
    setup_fee,
    monthly_fee,
    annual_value: totalMonthlyGap * 12,
  }
}
