// AuraFlow Platform — Complete TypeScript Types
// Client App + Diagnostic Engine + Data Acquisition

// ═══════════════════════════════════════
// CLIENT APP TYPES
// ═══════════════════════════════════════

export interface ClientProfile {
  id: string
  user_id: string
  client_id: string
  business_name: string
  contact_name: string
  contact_email: string
  contact_phone: string | null
  industry: string
  employee_count: string
  revenue_range: string | null
  complexity_score: number
  foundation_score: number
  hierarchy_depth: number
  advisor_name: string | null
  advisor_email: string | null
  onboarded_at: string
}

export interface Lead {
  id: string
  client_id: string
  lead_name: string
  lead_email: string | null
  lead_phone: string | null
  lead_location: string | null
  source: LeadSource
  service_type: string
  estimated_value: number
  lead_score: number
  status: LeadStatus
  follow_up_stage: number
  follow_up_history: FollowUpEntry[]
  notes: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
  qualified_at: string | null
  booked_at: string | null
  won_at: string | null
  lost_at: string | null
  lost_reason: string | null
}

export type LeadSource = 'google_ads' | 'meta' | 'angi' | 'yelp' | 'organic' | 'referral' | 'direct' | 'lsa' | 'thumbtack'
export type LeadStatus = 'new' | 'qualified' | 'contacted' | 'booked' | 'won' | 'lost'

export interface FollowUpEntry {
  stage: number
  channel: 'sms' | 'email' | 'voicemail' | 'call'
  content: string
  sent_at: string
  opened: boolean
}

export interface DailyMetrics {
  id: string
  client_id: string
  date: string
  leads_captured: number
  leads_qualified: number
  leads_booked: number
  leads_won: number
  leads_lost: number
  avg_response_time_sec: number
  cost_per_lead: number
  ad_spend: number
  ad_revenue: number
  ad_roas: number
  ad_clicks: number
  ad_impressions: number
  reviews_received: number
  reviews_responded: number
  avg_review_score: number
  total_reviews: number
  organic_traffic: number
  keywords_ranking: number
  top_keyword: string | null
  top_keyword_position: number | null
  admin_hours_saved: number
  workflows_executed: number
  foundation_score: number
  pipeline_value: number
}

export interface AgentActivity {
  id: string
  client_id: string
  agent_name: AgentName
  action: string
  details: string | null
  category: ActivityCategory
  status: ActivityStatus
  requires_approval: boolean
  approved_by: string | null
  approved_at: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export type AgentName = 'cyrus' | 'maven' | 'orion' | 'atlas' | 'apex' | 'nova'
export type ActivityCategory = 'lead' | 'ad' | 'review' | 'seo' | 'workflow' | 'system' | 'financial'
export type ActivityStatus = 'completed' | 'pending_approval' | 'failed' | 'in_progress'

export interface ChatMessage {
  id: string
  client_id: string
  role: 'user' | 'assistant'
  content: string
  metadata: {
    actions?: { label: string; action: string }[]
    data_card?: Record<string, unknown>
  }
  created_at: string
}

export interface Notification {
  id: string
  client_id: string
  type: NotificationType
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  body: string | null
  read: boolean
  action_url: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export type NotificationType =
  | 'lead_new' | 'lead_hot' | 'review_new' | 'review_negative'
  | 'agent_action' | 'advisor_message' | 'report_ready' | 'system_alert'

export interface HierarchyNode {
  id: string
  client_id: string
  parent_id: string | null
  layer_type: LayerType
  layer_position: number
  node_name: string
  is_active: boolean
  metadata: Record<string, unknown>
  created_at: string
}

export type LayerType =
  | 'core_c1' | 'core_c2' | 'core_c3'
  | 'ext_e1' | 'ext_e2' | 'ext_e3' | 'ext_e4' | 'ext_e5' | 'ext_e6' | 'ext_e7'

export interface DashboardPulse {
  greeting: string
  business_name: string
  metrics: {
    leads_today: number
    avg_response_time_sec: number
    pipeline_value: number
    total_reviews: number
    leads_trend: number
    response_trend: number
    pipeline_trend: number
    reviews_trend: number
  }
  recent_activity: AgentActivity[]
  unread_notifications: number
}

export interface AgentConfig {
  name: AgentName
  display_name: string
  role: string
  color: string
  icon: string
}

export const AGENTS: AgentConfig[] = [
  { name: 'cyrus', display_name: 'Cyrus', role: 'Chief Orchestrator', color: '#8b5cf6', icon: 'C' },
  { name: 'maven', display_name: 'Maven', role: 'Marketing Intelligence', color: '#10b981', icon: 'M' },
  { name: 'orion', display_name: 'Orion', role: 'Operations Intelligence', color: '#3b82f6', icon: 'O' },
  { name: 'atlas', display_name: 'Atlas', role: 'Administrative Intelligence', color: '#f59e0b', icon: 'A' },
  { name: 'apex', display_name: 'Apex', role: 'Human Performance', color: '#ef4444', icon: 'X' },
  { name: 'nova', display_name: 'Nova', role: 'Finance & Legal', color: '#a78bfa', icon: 'N' },
]

export const LEAD_SOURCES: Record<LeadSource, { label: string; color: string }> = {
  google_ads: { label: 'Google Ads', color: '#4285f4' },
  meta: { label: 'Meta Ads', color: '#1877f2' },
  angi: { label: 'Angi', color: '#ff6138' },
  yelp: { label: 'Yelp', color: '#d32323' },
  organic: { label: 'Organic', color: '#10b981' },
  referral: { label: 'Referral', color: '#d4af37' },
  direct: { label: 'Direct', color: '#8b5cf6' },
  lsa: { label: 'Google LSA', color: '#34a853' },
  thumbtack: { label: 'Thumbtack', color: '#009fd9' },
}

// ═══════════════════════════════════════
// DIAGNOSTIC ENGINE TYPES
// ═══════════════════════════════════════

export type Vertical =
  | 'home_services' | 'restaurant' | 'agency' | 'real_estate' | 'ecommerce'
  | 'healthcare' | 'saas' | 'construction' | 'law' | 'accounting'
  | 'fitness' | 'insurance' | 'logistics' | 'manufacturing' | 'education'

export type SizeBand = 'small' | 'medium' | 'large'
export type HealthLevel = 'broken' | 'functional' | 'growing' | 'strong' | 'optimized' | 'disqualified'
export type DataPointMethod = 'Q' | 'A' | 'I' | 'P'
export type DataPointType = 'Binary' | 'Numeric' | 'Percentage' | 'Currency' | 'Category' | 'Multi' | 'Scale' | 'Text'

export type DiagnosticDimension =
  | 'digital_presence'
  | 'lead_generation'
  | 'advertising'
  | 'reputation'
  | 'operations'
  | 'financial'
  | 'people'

export interface DiagnosticResult {
  id: string
  client_id: string
  diagnostic_type: 'pre_scan' | 'full_diagnostic'
  vertical: Vertical
  company_size_band: SizeBand
  foundation_score: number
  complexity_score: number
  dimension_scores: Record<DiagnosticDimension, number>
  raw_data: Record<string, unknown>
  break_points: BreakPoint[]
  gap_analysis: GapItem[]
  recommendations: Recommendation[]
  competitor_comparison: CompetitorData[]
  suggested_setup_fee: number
  suggested_monthly_fee: number
  total_annual_value: number
  scanned_at: string
  analyzed_at: string | null
  report_generated_at: string | null
  analyst: string
  version: string
}

export interface BreakPoint {
  id: string
  dimension: DiagnosticDimension
  data_point_id: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  current_value: unknown
  benchmark_value: unknown
  monthly_impact: number
}

export interface GapItem {
  gap: string
  dimension: DiagnosticDimension
  current_state: string
  target_state: string
  monthly_value: number
  value_breakdown: {
    time_savings: number
    revenue_increase: number
    cost_reduction: number
    opportunity_cost: number
  }
}

export interface Recommendation {
  priority: number
  action: string
  timeline: string
  investment: string
  expected_roi: string
}

export interface CompetitorData {
  competitor_name: string
  google_rating: number
  google_reviews: number
  website_score: number
  seo_keywords: number
  estimated_foundation_score: number
}

export interface IndustryBenchmark {
  id: string
  vertical: Vertical
  size_band: SizeBand
  data_point_id: string
  data_point_name: string
  benchmark_p25: number
  benchmark_median: number
  benchmark_p75: number
  benchmark_top10: number
  sample_size: number
  source: string
  last_updated: string
}

export interface MockDataset {
  id: string
  dataset_id: string
  vertical: Vertical
  size_band: SizeBand
  health_level: HealthLevel
  company_name: string
  location: string
  employee_count: number
  revenue: number
  foundation_score: number
  complexity_score: number
  dimension_scores: Record<DiagnosticDimension, number>
  raw_data: Record<string, unknown>
  break_points: BreakPoint[]
  gap_analysis: GapItem[]
  total_gap_value_monthly: number
  suggested_monthly_fee: number
  suggested_setup_fee: number
  is_disqualified: boolean
}

// ═══════════════════════════════════════
// SCRAPING TYPES
// ═══════════════════════════════════════

export interface ScanHistoryEntry {
  id: string
  business_name: string
  vertical: Vertical
  website_url: string | null
  location: string
  google_rating: number
  google_review_count: number
  google_categories: string
  scan_data: {
    lighthouse?: LighthouseData
    structure?: WebsiteStructureData
    social?: SocialPresenceData
  }
  preliminary_score: number | null
  created_at: string
}

export interface LighthouseData {
  performance_score: number
  seo_score: number
  accessibility_score: number
  lcp: number
  fid: number
  cls: number
  page_load_ms: number
  mobile_friendly: boolean
}

export interface WebsiteStructureData {
  has_contact_form: boolean
  has_chat_widget: boolean
  phone_visible: boolean
  has_blog: boolean
  service_pages_count: number
  has_schema: boolean
  has_analytics: boolean
  has_facebook_pixel: boolean
  meta_description_exists: boolean
  h1_count: number
  image_count: number
  images_with_alt: number
  internal_links: number
  external_links: number
  ssl: boolean
  cms: string
}

export interface SocialPresenceData {
  has_instagram: boolean
  ig_followers: number
  ig_posts: number
  ig_last_post_days_ago: number
  has_facebook: boolean
  fb_followers: number
  fb_last_post_days_ago: number
  has_linkedin: boolean
}

export interface ApifyGoogleMapsResult {
  title: string
  totalScore: number
  reviewsCount: number
  categoryName: string
  address: string
  city: string
  state: string
  phone: string
  website: string
  imageCount: number
  location: { lat: number; lng: number }
}

// Pre-diagnostic scan response (public-facing)
export interface PreScanResult {
  business_name: string
  website_url: string
  preliminary_score: number
  dimension_scores: {
    digital_presence: number
    reputation: number
    advertising: number
  }
  top_gaps: {
    title: string
    description: string
    monthly_value: number
    severity: 'critical' | 'high' | 'medium' | 'low'
  }[]
  competitor_preview: CompetitorData[]
  total_monthly_gap: number
  scan_id: string
}

// ═══════════════════════════════════════
// DISPLAY CONFIGS
// ═══════════════════════════════════════

export const VERTICALS: Record<Vertical, { label: string; icon: string }> = {
  home_services:  { label: 'Home Services',   icon: '🔧' },
  restaurant:     { label: 'Restaurant',       icon: '🍽️' },
  agency:         { label: 'Digital Agency',   icon: '💻' },
  real_estate:    { label: 'Real Estate',      icon: '🏠' },
  ecommerce:      { label: 'E-Commerce',       icon: '🛒' },
  healthcare:     { label: 'Healthcare',       icon: '⚕️' },
  saas:           { label: 'SaaS',             icon: '☁️' },
  construction:   { label: 'Construction',     icon: '🏗️' },
  law:            { label: 'Law Firm',         icon: '⚖️' },
  accounting:     { label: 'Accounting',       icon: '📊' },
  fitness:        { label: 'Fitness & Wellness', icon: '💪' },
  insurance:      { label: 'Insurance',        icon: '🛡️' },
  logistics:      { label: 'Logistics',        icon: '🚚' },
  manufacturing:  { label: 'Manufacturing',    icon: '🏭' },
  education:      { label: 'Education',        icon: '📚' },
}

export const DIMENSION_LABELS: Record<DiagnosticDimension, string> = {
  digital_presence: 'Digital Presence',
  lead_generation:  'Lead Generation',
  advertising:      'Advertising',
  reputation:       'Reputation',
  operations:       'Operations',
  financial:        'Financial Health',
  people:           'People & Team',
}
