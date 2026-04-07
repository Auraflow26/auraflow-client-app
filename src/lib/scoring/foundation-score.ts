// AuraFlow Foundation Score Algorithm
// Produces a 0-100 score from 163 data points across 7 dimensions

import type { Vertical, DiagnosticDimension } from '@/lib/types'
import { DIMENSION_WEIGHTS, DIMENSION_MAX_SCORES } from './dimension-weights'

// Raw scores for a set of data points
// Returns: dimension -> raw points achieved
export function scoreDimensions(raw: Record<string, unknown>): Record<DiagnosticDimension, number> {
  return {
    digital_presence: scoreDigitalPresence(raw),
    lead_generation: scoreLeadGeneration(raw),
    advertising: scoreAdvertising(raw),
    reputation: scoreReputation(raw),
    operations: scoreOperations(raw),
    financial: scoreFinancial(raw),
    people: scorePeople(raw),
  }
}

// Foundation Score = weighted sum of normalized dimension scores
export function calculateFoundationScore(
  raw: Record<string, unknown>,
  vertical: Vertical
): number {
  const dimScores = scoreDimensions(raw)
  const weights = DIMENSION_WEIGHTS[vertical]

  let total = 0
  for (const dim of Object.keys(dimScores) as DiagnosticDimension[]) {
    const maxRaw = DIMENSION_MAX_SCORES[dim]
    const normalized = maxRaw > 0 ? Math.min(dimScores[dim] / maxRaw, 1) : 0
    total += normalized * weights[dim]
  }

  return Math.round(total)
}

// Complexity Score (10-40): measures how complex the business is to serve
// Higher = more complex = higher price & more capability required
export function calculateComplexityScore(raw: Record<string, unknown>): number {
  let score = 10 // base

  // Tool count & integrations
  const tools = num(raw.O01)
  if (tools >= 10) score += 4
  else if (tools >= 6) score += 2
  else if (tools >= 3) score += 1

  // Revenue size
  const revenue = num(raw.F01)
  if (revenue >= 2000000) score += 6
  else if (revenue >= 500000) score += 4
  else if (revenue >= 200000) score += 2

  // Employee count
  const employees = num(raw.P01)
  if (employees >= 20) score += 5
  else if (employees >= 10) score += 3
  else if (employees >= 5) score += 1

  // Ad spend (more = more complex)
  const adSpend = num(raw.A01)
  if (adSpend >= 10000) score += 5
  else if (adSpend >= 3000) score += 3
  else if (adSpend >= 500) score += 1

  // Multi-location
  if (bool(raw.O_MULTI_LOCATION)) score += 4

  // Industry-specific platform
  if (raw.O27 && raw.O27 !== 'none') score += 3

  return Math.min(40, Math.max(10, score))
}

// ─── Dimension scorers ───────────────────────────────────────────────────────

function scoreDigitalPresence(r: Record<string, unknown>): number {
  let s = 0
  s += bool(r.D01) ? 3 : 0           // website exists
  s += bool(r.D04) ? 3 : 0           // mobile responsive
  s += clamp(10 - num(r.D05), 0, 2)  // page speed (2pts if ≤0s, grades down)
  s += bool(r.D07) ? 2 : 0           // SSL
  s += bool(r.D13) ? 2 : 0           // contact form
  s += bool(r.D14) ? 2 : 0           // phone visible
  s += bool(r.D21) ? 2 : 0           // Google Analytics
  s += bool(r.D24) ? 2 : 0           // conversion tracking
  s += bool(r.D20) ? 1 : 0           // schema markup
  s += num(r.D11) >= 3 ? 2 : num(r.D11) >= 1 ? 1 : 0  // service pages
  s += bool(r.D09) ? 1 : 0           // blog exists
  s += num(r.D10) >= 4 ? 2 : num(r.D10) >= 1 ? 1 : 0  // blog frequency
  s += num(r.D28) >= 50 ? 2 : num(r.D28) >= 10 ? 1 : 0 // organic keywords
  s += bool(r.D15) ? 1 : 0           // click-to-call
  s += bool(r.D16) ? 1 : 0           // chat widget
  // page speed graduated: 2pts if <2s, 1pt if <4s
  const speed = num(r.D05)
  if (speed > 0 && speed <= 2) s += 2
  else if (speed <= 4) s += 1
  return s
}

function scoreLeadGeneration(r: Record<string, unknown>): number {
  let s = 0
  // Response time (L04) — most impactful
  const responseMin = num(r.L04)
  if (responseMin > 0 && responseMin <= 5) s += 4
  else if (responseMin <= 30) s += 3
  else if (responseMin <= 120) s += 2
  else if (responseMin <= 480) s += 1

  s += bool(r.L09) ? 2 : 0           // qualification process
  s += bool(r.L10) ? 2 : 0           // lead scoring
  s += bool(r.L14) ? 3 : 0           // follow-up sequence
  s += num(r.L15) >= 5 ? 2 : num(r.L15) >= 2 ? 1 : 0 // follow-up touchpoints
  s += num(r.L17) <= 1 ? 3 : num(r.L17) <= 4 ? 2 : num(r.L17) <= 24 ? 1 : 0 // time to first follow-up (hrs)
  s += num(r.L07) >= 90 ? 3 : num(r.L07) >= 70 ? 2 : num(r.L07) >= 50 ? 1 : 0 // phone answer rate
  s += bool(r.L21) ? 2 : 0           // online booking
  s += num(r.L23) >= 40 ? 3 : num(r.L23) >= 20 ? 2 : num(r.L23) >= 10 ? 1 : 0 // lead-to-appt rate
  s += num(r.L24) >= 50 ? 3 : num(r.L24) >= 30 ? 2 : num(r.L24) >= 15 ? 1 : 0 // appt-to-close rate
  s += bool(r.L19) ? 1 : 0           // referral program
  s += num(r.L20) >= 20 ? 2 : num(r.L20) >= 10 ? 1 : 0 // referral rate
  return s
}

function scoreAdvertising(r: Record<string, unknown>): number {
  let s = 0
  s += bool(r.A03) ? 2 : 0           // Google Ads exists
  s += bool(r.A04) ? 3 : 0           // conversion tracking
  s += num(r.A20) >= 4 ? 3 : num(r.A20) >= 2.5 ? 2 : num(r.A20) >= 1.5 ? 1 : 0 // ROAS
  s += bool(r.A08) ? 2 : 0           // Google LSA active
  s += bool(r.A10) ? 1 : 0           // Meta Ads
  s += num(r.A11) >= 3 ? 2 : num(r.A11) >= 1.5 ? 1 : 0 // Meta ROAS
  s += bool(r.A15) ? 1 : 0           // A/B testing
  s += bool(r.A19) ? 2 : 0           // retargeting active
  s += bool(r.A17) ? 1 : 0           // geo-targeting
  s += bool(r.A18) ? 1 : 0           // ad scheduling
  s += bool(r.A16) ? 1 : 0           // negative keywords
  s += num(r.A06) >= 5 ? 2 : num(r.A06) >= 2 ? 1 : 0  // CTR %
  return s
}

function scoreReputation(r: Record<string, unknown>): number {
  let s = 0
  s += bool(r.R01) ? 3 : 0           // GBP claimed
  s += num(r.R05) >= 100 ? 3 : num(r.R05) >= 50 ? 2 : num(r.R05) >= 20 ? 1 : 0 // review count
  s += num(r.R06) >= 4.7 ? 3 : num(r.R06) >= 4.3 ? 2 : num(r.R06) >= 4.0 ? 1 : 0 // rating
  s += num(r.R07) >= 10 ? 2 : num(r.R07) >= 4 ? 1 : 0  // review velocity
  s += num(r.R08) >= 80 ? 3 : num(r.R08) >= 50 ? 2 : num(r.R08) >= 25 ? 1 : 0 // response rate
  s += bool(r.R15) ? 2 : 0           // review generation system
  s += bool(r.R16) ? 2 : 0           // negative review protocol
  s += num(r.R17) >= 90 ? 2 : num(r.R17) >= 70 ? 1 : 0 // NAP consistency
  s += bool(r.R10) ? 1 : 0           // Yelp claimed
  s += bool(r.R13) ? 1 : 0           // BBB profile
  return s
}

function scoreOperations(r: Record<string, unknown>): number {
  let s = 0
  const tools = num(r.O01)
  const integrated = num(r.O02)
  const integrationRate = tools > 0 ? integrated / tools : 0
  s += integrationRate >= 0.7 ? 3 : integrationRate >= 0.4 ? 2 : integrationRate >= 0.2 ? 1 : 0

  s += num(r.O03) <= 5 ? 3 : num(r.O03) <= 10 ? 2 : num(r.O03) <= 20 ? 1 : 0 // manual hours/week
  s += bool(r.O04) ? 2 : 0           // SOPs exist
  s += bool(r.O08) ? 2 : 0           // invoicing automated
  s += bool(r.O09) ? 2 : 0           // payment automated
  s += bool(r.O10) ? 2 : 0           // customer comms automated
  s += num(r.O15) <= 20 ? 3 : num(r.O15) <= 35 ? 2 : num(r.O15) <= 50 ? 1 : 0 // owner hrs/week
  s += bool(r.O22) ? 2 : 0           // reporting/dashboard exists
  s += bool(r.O07) ? 2 : 0           // scheduling system
  s += (r.O17 === 'yes') ? 3 : (r.O17 === 'maybe') ? 1 : 0 // can handle 2x
  return s
}

function scoreFinancial(r: Record<string, unknown>): number {
  let s = 0
  s += bool(r.F05) ? 2 : 0           // knows CAC
  s += bool(r.F06) ? 2 : 0           // knows LTV
  s += num(r.F08) >= 50 ? 2 : num(r.F08) >= 30 ? 1 : 0 // repeat customer rate
  s += (r.F02 === 'growing') ? 2 : 0
  s += bool(r.F14) ? 1 : 0           // dedicated accounting software
  s += num(r.F07) >= 150000 ? 2 : num(r.F07) >= 80000 ? 1 : 0 // revenue/employee
  s += num(r.F10) <= 20 ? 2 : num(r.F10) <= 40 ? 1 : 0 // low seasonal variance
  return s
}

function scorePeople(r: Record<string, unknown>): number {
  let s = 0
  s += num(r.P03) <= 20 ? 2 : num(r.P03) <= 35 ? 1 : 0 // low turnover
  s += bool(r.P04) ? 2 : 0           // has org chart
  s += bool(r.P05) ? 2 : 0           // formal review process
  s += num(r.P09) <= 40 ? 2 : num(r.P09) <= 55 ? 1 : 0 // owner hrs/week (people section)
  s += bool(r.P08) ? 1 : 0           // documented roles
  return s
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function num(v: unknown): number {
  if (v == null) return 0
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

function bool(v: unknown): boolean {
  if (v == null) return false
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') return v.toLowerCase() === 'yes' || v === 'true' || v === '1'
  return Boolean(v)
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max)
}
