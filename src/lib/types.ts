// AuraFlow Client App — TypeScript Types

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
  metadata: Record<string, any>
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
    data_card?: Record<string, any>
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
  metadata: Record<string, any>
  created_at: string
}

export type NotificationType = 'lead_new' | 'lead_hot' | 'review_new' | 'review_negative' | 'agent_action' | 'advisor_message' | 'report_ready' | 'system_alert'

export interface HierarchyNode {
  id: string
  client_id: string
  parent_id: string | null
  layer_type: LayerType
  layer_position: number
  node_name: string
  is_active: boolean
  metadata: Record<string, any>
  created_at: string
}

export type LayerType = 'core_c1' | 'core_c2' | 'core_c3' | 'ext_e1' | 'ext_e2' | 'ext_e3' | 'ext_e4' | 'ext_e5' | 'ext_e6' | 'ext_e7'

// Dashboard aggregated types
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

// Agent config for UI display
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

// Lead source display config
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
