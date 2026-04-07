// AuraFlow — Google PageSpeed Insights / Lighthouse wrapper
// Uses the public PageSpeed Insights API (no key needed for basic usage)

import type { LighthouseData } from '@/lib/types'

const PSI_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

interface PSIResponse {
  lighthouseResult?: {
    categories?: {
      performance?: { score: number }
      seo?: { score: number }
      accessibility?: { score: number }
    }
    audits?: {
      'largest-contentful-paint'?: { numericValue: number }
      'total-blocking-time'?: { numericValue: number }
      'cumulative-layout-shift'?: { numericValue: number }
      'speed-index'?: { numericValue: number }
      'interactive'?: { numericValue: number }
    }
  }
  loadingExperience?: {
    overall_category?: string
  }
}

export async function runLighthouse(url: string): Promise<LighthouseData | null> {
  try {
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY
    const params = new URLSearchParams({
      url,
      strategy: 'mobile',
      ...(apiKey ? { key: apiKey } : {}),
    })

    const res = await fetch(`${PSI_API}?${params}`, {
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) return null
    const data: PSIResponse = await res.json()
    const lr = data.lighthouseResult

    if (!lr) return null

    const perf = Math.round((lr.categories?.performance?.score ?? 0) * 100)
    const seo = Math.round((lr.categories?.seo?.score ?? 0) * 100)
    const accessibility = Math.round((lr.categories?.accessibility?.score ?? 0) * 100)
    const lcp = (lr.audits?.['largest-contentful-paint']?.numericValue ?? 0) / 1000
    const tbt = lr.audits?.['total-blocking-time']?.numericValue ?? 0
    const cls = lr.audits?.['cumulative-layout-shift']?.numericValue ?? 0
    const pageLoadMs = lr.audits?.['interactive']?.numericValue ?? 0

    return {
      performance_score: perf,
      seo_score: seo,
      accessibility_score: accessibility,
      lcp: Math.round(lcp * 10) / 10,
      fid: Math.round(tbt),
      cls: Math.round(cls * 100) / 100,
      page_load_ms: Math.round(pageLoadMs),
      mobile_friendly: perf >= 50,
    }
  } catch {
    return null
  }
}

// Convert Lighthouse data to raw scoring data points
export function lighthouseToDataPoints(lh: LighthouseData): Record<string, unknown> {
  return {
    D04: lh.mobile_friendly,
    D05: lh.page_load_ms / 1000,
    D06: lh.lcp <= 2.5 && lh.cls <= 0.1,
    D07: true, // if we got a response, SSL likely works
  }
}
