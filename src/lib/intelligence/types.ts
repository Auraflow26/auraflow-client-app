// Intelligence Bridge Types — Directives, Lead Analysis, Chat Context

export type DirectiveType = 'lead' | 'ad' | 'content' | 'review' | 'seo' | 'financial'
export type DirectiveSeverity = 'urgent' | 'important' | 'informational'
export type DirectiveActionType =
  | 'draft_lead_email'
  | 'optimize_campaign'
  | 'generate_content'
  | 'respond_review'
  | 'boost_seo'
  | 'view_details'

export interface Directive {
  id: string
  client_id: string
  type: DirectiveType
  severity: DirectiveSeverity
  headline: string
  body: string | null
  action_label: string | null
  action_type: DirectiveActionType | null
  action_payload: Record<string, unknown>
  source_data: Record<string, unknown>
  dismissed: boolean
  acted_on: boolean
  created_at: string
}

export type LeadUrgency = 'immediate' | 'today' | 'this_week' | 'low'

export interface LeadAnalysis {
  id: string
  client_id: string
  lead_id: string
  intent_score: number
  intent_signals: string[]
  suggested_reply: string
  urgency: LeadUrgency
  analysis_summary: string
  created_at: string
}

export interface ChatContext {
  id: string
  client_id: string
  key: string
  value: string
  source: 'explicit' | 'inferred'
  confidence: number
  created_at: string
  updated_at: string
}

// Claude structured output shapes (used internally by bridge)
export interface DirectiveGeneration {
  directives: {
    type: DirectiveType
    severity: DirectiveSeverity
    headline: string
    body: string
    action_label: string
    action_type: DirectiveActionType
    action_payload: Record<string, unknown>
  }[]
}

export interface LeadAnalysisGeneration {
  intent_score: number
  intent_signals: string[]
  suggested_reply: string
  urgency: LeadUrgency
  analysis_summary: string
}

export interface PreferenceExtraction {
  preferences: {
    key: string
    value: string
    confidence: number
  }[]
}
