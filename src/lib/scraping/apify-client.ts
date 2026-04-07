// AuraFlow — Apify API wrapper
// Used for Google Maps scraping, social media, and website analysis at scale

import type { ApifyGoogleMapsResult } from '@/lib/types'

const APIFY_BASE = 'https://api.apify.com/v2'

export async function runApifyActor<T = unknown>(
  actorId: string,
  input: Record<string, unknown>,
  timeoutMs = 120000
): Promise<T[]> {
  const apiKey = process.env.APIFY_API_KEY
  if (!apiKey) throw new Error('APIFY_API_KEY not set')

  // Start actor run
  const startRes = await fetch(`${APIFY_BASE}/acts/${actorId}/runs?token=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!startRes.ok) {
    const text = await startRes.text()
    throw new Error(`Apify start failed: ${text}`)
  }

  const startData = await startRes.json() as { data: { id: string; defaultDatasetId: string } }
  const runId = startData.data.id

  // Poll for completion
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, 5000))

    const statusRes = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${apiKey}`)
    const statusData = await statusRes.json() as { data: { status: string; defaultDatasetId: string } }
    const { status, defaultDatasetId } = statusData.data

    if (status === 'SUCCEEDED') {
      const resultsRes = await fetch(
        `${APIFY_BASE}/datasets/${defaultDatasetId}/items?token=${apiKey}&format=json`
      )
      return (await resultsRes.json()) as T[]
    }

    if (status === 'FAILED' || status === 'ABORTED') {
      throw new Error(`Apify run ${runId} ended with status: ${status}`)
    }
  }

  throw new Error(`Apify run ${runId} timed out after ${timeoutMs}ms`)
}

// Scrape Google Maps for businesses in a vertical + location
export async function scrapeGoogleMaps(
  queries: string[],
  maxResults: number = 50
): Promise<ApifyGoogleMapsResult[]> {
  return runApifyActor<ApifyGoogleMapsResult>('apify/google-maps-scraper', {
    searchStringsArray: queries,
    maxCrawledPlacesPerSearch: maxResults,
    language: 'en',
    maxImages: 0,
    exportPlaceUrls: false,
    additionalInfo: false,
    scrapeDirectories: false,
  })
}

// Scrape Instagram profile
export async function scrapeInstagram(username: string): Promise<{
  followersCount: number
  postsCount: number
  lastPostDate: string | null
} | null> {
  try {
    const results = await runApifyActor<{
      followersCount: number
      postsCount: number
      timestamp?: string
    }>('apify/instagram-profile-scraper', {
      usernames: [username],
    }, 60000)

    const profile = results[0]
    if (!profile) return null

    return {
      followersCount: profile.followersCount,
      postsCount: profile.postsCount,
      lastPostDate: profile.timestamp ?? null,
    }
  } catch {
    return null
  }
}

// Convert Google Maps result to raw scoring data points
export function mapsResultToDataPoints(result: ApifyGoogleMapsResult): Record<string, unknown> {
  const reviewCount = result.reviewsCount ?? 0
  const rating = result.totalScore ?? 0

  return {
    D01: Boolean(result.website),
    R01: true,               // GBP claimed (we got it from maps)
    R05: reviewCount,
    R06: rating,
    R07: Math.round(reviewCount / 12), // rough monthly velocity (annualized ÷ 12)
    R10: false,              // Yelp — unknown from Maps
  }
}
