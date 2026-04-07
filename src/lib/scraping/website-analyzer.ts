// AuraFlow — Website structure analyzer
// Fetches a webpage and extracts SEO/conversion structural data

import type { WebsiteStructureData } from '@/lib/types'

export async function analyzeWebsite(url: string): Promise<WebsiteStructureData | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AuraFlow-Scanner/1.0 (diagnostic scan)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    const html = await res.text()
    return extractStructure(html, url)
  } catch {
    return null
  }
}

function extractStructure(html: string, _url: string): WebsiteStructureData {
  const lower = html.toLowerCase()

  // CMS detection
  let cms = 'unknown'
  if (lower.includes('wp-content') || lower.includes('wordpress')) cms = 'WordPress'
  else if (lower.includes('squarespace')) cms = 'Squarespace'
  else if (lower.includes('wix.com') || lower.includes('wixsite')) cms = 'Wix'
  else if (lower.includes('shopify')) cms = 'Shopify'
  else if (lower.includes('webflow')) cms = 'Webflow'
  else if (lower.includes('framer')) cms = 'Framer'
  else if (lower.includes('godaddy')) cms = 'GoDaddy'

  // Analytics
  const has_analytics =
    lower.includes('gtag(') ||
    lower.includes('google-analytics') ||
    lower.includes('googletagmanager') ||
    lower.includes('ua-') ||
    lower.includes('g-')

  const has_facebook_pixel =
    lower.includes('fbevents.js') ||
    lower.includes('facebook.net/en_us/fbevents') ||
    lower.includes('fbq(')

  // Contact / conversion elements
  const has_contact_form =
    lower.includes('<form') &&
    (lower.includes('contact') || lower.includes('inquiry') || lower.includes('submit'))

  const has_chat_widget =
    lower.includes('intercom') ||
    lower.includes('drift.com') ||
    lower.includes('tidio') ||
    lower.includes('livechat') ||
    lower.includes('crisp.chat') ||
    lower.includes('freshchat')

  const phone_visible =
    /\d{3}[-.\s]\d{3}[-.\s]\d{4}/.test(html) ||
    lower.includes('tel:')

  // Content structure
  const has_blog =
    lower.includes('/blog') ||
    lower.includes('/news') ||
    lower.includes('/articles') ||
    lower.includes('blog-post') ||
    lower.includes('article')

  // Count elements
  const h1Count = (html.match(/<h1[^>]*>/gi) ?? []).length
  const imageCount = (html.match(/<img[^>]*>/gi) ?? []).length
  const imagesWithAlt = (html.match(/<img[^>]*alt=["'][^"']+["'][^>]*>/gi) ?? []).length

  const internalLinkMatches = html.match(/href=["'](?!http|mailto|tel|#)[^"']+["']/gi) ?? []
  const externalLinkMatches = html.match(/href=["']https?:\/\/[^"']+["']/gi) ?? []

  // Service pages (rough count of nav/links that look like services)
  const serviceKeywords = ['service', 'repair', 'install', 'replace', 'clean', 'maintain', 'treatment']
  const servicePageLinks = (html.match(/href=["'][^"']*["']/gi) ?? [])
    .filter(l => serviceKeywords.some(k => l.toLowerCase().includes(k))).length

  // Schema markup
  const has_schema = lower.includes('application/ld+json') || lower.includes('schema.org')

  // Meta descriptions
  const meta_description_exists = lower.includes('name="description"') || lower.includes("name='description'")

  // SSL — inferred from fetch success on https://
  const ssl = true

  return {
    has_contact_form,
    has_chat_widget,
    phone_visible,
    has_blog,
    service_pages_count: Math.min(servicePageLinks, 15),
    has_schema,
    has_analytics,
    has_facebook_pixel,
    meta_description_exists,
    h1_count: h1Count,
    image_count: imageCount,
    images_with_alt: imagesWithAlt,
    internal_links: internalLinkMatches.length,
    external_links: externalLinkMatches.length,
    ssl,
    cms,
  }
}

// Convert structure data to raw scoring data points
export function structureToDataPoints(s: WebsiteStructureData): Record<string, unknown> {
  return {
    D01: true,
    D02: s.cms,
    D07: s.ssl,
    D09: s.has_blog,
    D11: s.service_pages_count,
    D13: s.has_contact_form,
    D14: s.phone_visible,
    D16: s.has_chat_widget,
    D17: s.meta_description_exists,
    D18: s.h1_count > 0,
    D19: s.image_count > 0 ? Math.round((s.images_with_alt / s.image_count) * 100) : 0,
    D20: s.has_schema,
    D21: s.has_analytics,
    D23: s.has_facebook_pixel,
  }
}
