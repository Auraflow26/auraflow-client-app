-- AuraFlow Complete Supabase Schema
-- Client App + Diagnostic Engine + Data Acquisition
-- Run in: https://supabase.com/dashboard/project/bfzdcyuyilesubtgbhdc/sql
-- Existing tables (8) are preserved — this creates ADDITIONAL tables

-- ═══════════════════════════════════════════════════
-- SECTION 1: CLIENT APP TABLES
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  industry TEXT,
  employee_count TEXT,
  revenue_range TEXT,
  complexity_score INT,
  foundation_score INT,
  hierarchy_depth INT DEFAULT 3,
  advisor_name TEXT,
  advisor_email TEXT,
  onboarded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON client_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON client_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  lead_name TEXT, lead_email TEXT, lead_phone TEXT, lead_location TEXT,
  source TEXT, service_type TEXT, estimated_value DECIMAL(10,2),
  lead_score INT, status TEXT DEFAULT 'new',
  follow_up_stage INT DEFAULT 0, follow_up_history JSONB DEFAULT '[]',
  notes TEXT, assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  qualified_at TIMESTAMPTZ, booked_at TIMESTAMPTZ, won_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ, lost_reason TEXT
);
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients see own leads" ON lead_interactions FOR SELECT USING (
  client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Clients update own leads" ON lead_interactions FOR UPDATE USING (
  client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id), date DATE NOT NULL,
  leads_captured INT DEFAULT 0, leads_qualified INT DEFAULT 0,
  leads_booked INT DEFAULT 0, leads_won INT DEFAULT 0, leads_lost INT DEFAULT 0,
  avg_response_time_sec INT, cost_per_lead DECIMAL(10,2),
  ad_spend DECIMAL(10,2) DEFAULT 0, ad_revenue DECIMAL(10,2) DEFAULT 0,
  ad_roas DECIMAL(5,2), ad_clicks INT DEFAULT 0, ad_impressions INT DEFAULT 0,
  reviews_received INT DEFAULT 0, reviews_responded INT DEFAULT 0,
  avg_review_score DECIMAL(3,2), total_reviews INT DEFAULT 0,
  organic_traffic INT DEFAULT 0, keywords_ranking INT DEFAULT 0,
  top_keyword TEXT, top_keyword_position INT,
  admin_hours_saved DECIMAL(5,2) DEFAULT 0, workflows_executed INT DEFAULT 0,
  foundation_score INT, pipeline_value DECIMAL(12,2) DEFAULT 0,
  UNIQUE(client_id, date)
);
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients see own metrics" ON daily_metrics FOR SELECT USING (
  client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS agent_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  agent_name TEXT NOT NULL, action TEXT NOT NULL, details TEXT,
  category TEXT, status TEXT DEFAULT 'completed',
  requires_approval BOOLEAN DEFAULT false,
  approved_by TEXT, approved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE agent_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients see own activity" ON agent_activity FOR SELECT USING (
  client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  role TEXT NOT NULL, content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients see own chats" ON chat_messages FOR SELECT USING (
  client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Clients insert chats" ON chat_messages FOR INSERT WITH CHECK (
  client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  type TEXT NOT NULL, severity TEXT DEFAULT 'medium',
  title TEXT NOT NULL, body TEXT, read BOOLEAN DEFAULT false,
  action_url TEXT, metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients see own notifications" ON notifications FOR SELECT USING (
  client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Clients update own notifications" ON notifications FOR UPDATE USING (
  client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS hierarchy_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  parent_id UUID REFERENCES hierarchy_nodes(id),
  layer_type TEXT NOT NULL, layer_position INT NOT NULL,
  node_name TEXT NOT NULL, is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE hierarchy_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients see own hierarchy" ON hierarchy_nodes FOR SELECT USING (
  client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
);

-- ═══════════════════════════════════════════════════
-- SECTION 2: DIAGNOSTIC ENGINE TABLES
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS diagnostic_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  diagnostic_type TEXT NOT NULL, -- pre_scan, full_diagnostic
  vertical TEXT NOT NULL,
  company_size_band TEXT,
  foundation_score INT,
  complexity_score INT,
  dimension_scores JSONB, -- {d1:8, d2:12, d3:3, ...}
  raw_data JSONB NOT NULL, -- all 163 data points
  break_points JSONB,
  gap_analysis JSONB,
  recommendations JSONB,
  competitor_comparison JSONB,
  suggested_setup_fee DECIMAL(10,2),
  suggested_monthly_fee DECIMAL(10,2),
  total_annual_value DECIMAL(12,2),
  scanned_at TIMESTAMPTZ DEFAULT now(),
  analyzed_at TIMESTAMPTZ,
  report_generated_at TIMESTAMPTZ,
  analyst TEXT DEFAULT 'automated',
  version TEXT DEFAULT '1.0'
);

CREATE TABLE IF NOT EXISTS industry_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical TEXT NOT NULL,
  size_band TEXT NOT NULL,
  data_point_id TEXT NOT NULL, -- D01, L04, A20, etc.
  data_point_name TEXT,
  benchmark_p25 DECIMAL(12,2),
  benchmark_median DECIMAL(12,2),
  benchmark_p75 DECIMAL(12,2),
  benchmark_top10 DECIMAL(12,2),
  sample_size INT DEFAULT 0,
  source TEXT,
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vertical, size_band, data_point_id)
);

CREATE TABLE IF NOT EXISTS scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  vertical TEXT,
  website_url TEXT,
  location TEXT,
  google_rating DECIMAL(3,2),
  google_review_count INT,
  google_categories TEXT,
  scan_data JSONB NOT NULL DEFAULT '{}', -- lighthouse, structure, social
  preliminary_score INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mock_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id TEXT UNIQUE NOT NULL, -- "HOME-SM-BROKEN-01"
  vertical TEXT NOT NULL,
  size_band TEXT NOT NULL,
  health_level TEXT NOT NULL,
  company_name TEXT NOT NULL,
  location TEXT,
  employee_count INT,
  revenue DECIMAL(12,2),
  foundation_score INT,
  complexity_score INT,
  dimension_scores JSONB,
  raw_data JSONB NOT NULL,
  break_points JSONB,
  gap_analysis JSONB,
  total_gap_value_monthly DECIMAL(10,2),
  suggested_monthly_fee DECIMAL(10,2),
  suggested_setup_fee DECIMAL(10,2),
  is_disqualified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════
-- SECTION 3: REALTIME + INDEXES
-- ═══════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE agent_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE lead_interactions;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

CREATE INDEX IF NOT EXISTS idx_leads_client ON lead_interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON lead_interactions(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON lead_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_client_date ON daily_metrics(client_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_client ON agent_activity(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON agent_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_client ON chat_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_notif_client_read ON notifications(client_id, read);
CREATE INDEX IF NOT EXISTS idx_hierarchy_client ON hierarchy_nodes(client_id);
CREATE INDEX IF NOT EXISTS idx_benchmarks_vertical ON industry_benchmarks(vertical, size_band);
CREATE INDEX IF NOT EXISTS idx_benchmarks_datapoint ON industry_benchmarks(data_point_id);
CREATE INDEX IF NOT EXISTS idx_scan_vertical ON scan_history(vertical);
CREATE INDEX IF NOT EXISTS idx_mock_vertical ON mock_datasets(vertical);
CREATE INDEX IF NOT EXISTS idx_mock_health ON mock_datasets(health_level);
CREATE INDEX IF NOT EXISTS idx_mock_score ON mock_datasets(foundation_score);
CREATE INDEX IF NOT EXISTS idx_diag_results_client ON diagnostic_results(client_id);
CREATE INDEX IF NOT EXISTS idx_diag_results_vertical ON diagnostic_results(vertical);
