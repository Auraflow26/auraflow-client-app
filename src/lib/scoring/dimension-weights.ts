// AuraFlow Scoring — Dimension weights per vertical
// Each vertical weights the 7 dimensions differently

import type { Vertical, DiagnosticDimension } from '@/lib/types'

// Weights must sum to 100 per vertical
export const DIMENSION_WEIGHTS: Record<Vertical, Record<DiagnosticDimension, number>> = {
  home_services: {
    digital_presence: 18,
    lead_generation:  28,
    advertising:      18,
    reputation:       16,
    operations:       12,
    financial:         5,
    people:            3,
  },
  restaurant: {
    digital_presence: 14,
    lead_generation:  20,
    advertising:      18,
    reputation:       24,
    operations:       14,
    financial:         6,
    people:            4,
  },
  agency: {
    digital_presence: 16,
    lead_generation:  22,
    advertising:      14,
    reputation:       14,
    operations:       22,
    financial:         8,
    people:            4,
  },
  real_estate: {
    digital_presence: 16,
    lead_generation:  26,
    advertising:      20,
    reputation:       18,
    operations:       12,
    financial:         5,
    people:            3,
  },
  ecommerce: {
    digital_presence: 22,
    lead_generation:  22,
    advertising:      24,
    reputation:       12,
    operations:       12,
    financial:         6,
    people:            2,
  },
  healthcare: {
    digital_presence: 14,
    lead_generation:  20,
    advertising:      14,
    reputation:       22,
    operations:       20,
    financial:         6,
    people:            4,
  },
  saas: {
    digital_presence: 18,
    lead_generation:  20,
    advertising:      16,
    reputation:       12,
    operations:       24,
    financial:         8,
    people:            2,
  },
  construction: {
    digital_presence: 12,
    lead_generation:  22,
    advertising:      14,
    reputation:       16,
    operations:       26,
    financial:         6,
    people:            4,
  },
  law: {
    digital_presence: 14,
    lead_generation:  24,
    advertising:      14,
    reputation:       20,
    operations:       20,
    financial:         6,
    people:            2,
  },
  accounting: {
    digital_presence: 12,
    lead_generation:  22,
    advertising:      12,
    reputation:       20,
    operations:       24,
    financial:         6,
    people:            4,
  },
  fitness: {
    digital_presence: 16,
    lead_generation:  24,
    advertising:      18,
    reputation:       20,
    operations:       14,
    financial:         4,
    people:            4,
  },
  insurance: {
    digital_presence: 12,
    lead_generation:  26,
    advertising:      16,
    reputation:       18,
    operations:       20,
    financial:         6,
    people:            2,
  },
  logistics: {
    digital_presence: 10,
    lead_generation:  18,
    advertising:      10,
    reputation:       12,
    operations:       36,
    financial:         8,
    people:            6,
  },
  manufacturing: {
    digital_presence:  8,
    lead_generation:  14,
    advertising:       8,
    reputation:       10,
    operations:       40,
    financial:        12,
    people:            8,
  },
  education: {
    digital_presence: 18,
    lead_generation:  24,
    advertising:      16,
    reputation:       20,
    operations:       14,
    financial:         4,
    people:            4,
  },
}

// Max raw scores per dimension (sum of all data point weights)
export const DIMENSION_MAX_SCORES: Record<DiagnosticDimension, number> = {
  digital_presence: 40, // sum of D01-D28 weights
  lead_generation:  50, // sum of L01-L24 weights
  advertising:      34, // sum of A01-A22 weights
  reputation:       32, // sum of R01-R18 weights
  operations:       44, // sum of O01-O32 weights
  financial:        30, // sum of F01-F21 weights
  people:           24, // sum of P01-P18 weights
}
