-- AuraFlow Client App — Supabase Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/bfzdcyuyilesubtgbhdc
-- This creates ADDITIONAL tables on top of the existing 8 tables

-- Client profiles (Level 2 users — the business owners)
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

-- Lead interactions
CREATE TABLE IF NOT EXISTS lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  lead_name TEXT,
  lead_email TEXT,
  lead_phone TEXT,
  lead_location TEXT,
  source TEXT, -- google_ads, meta, angi, yelp, organic, referral, direct, lsa, thumbtack
  service_type TEXT,
  estimated_value DECIMAL(10,2),
  lead_score INT, -- 0-100
  status TEXT DEFAULT 'new', -- new, qualified, contacted, booked, won, lost
  follow_up_stage INT DEFAULT 0,
  follow_up_history JSONB DEFAULT '[]',
  notes TEXT,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  qualified_at TIMESTAMPTZ,
  booked_at TIMESTAMPTZ,
  won_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  lost_reason TEXT
);

ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients see own leads" ON lead_interactions FOR SELECT USING (
  client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Clients update own leads" ON lead_interactions FOR UPDATE USING (
  client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
);

-- Daily metrics (aggregated by n8n nightly job)
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  date DATE NOT NULL,
  -- Marketing
  leads_captured INT DEFAULT 0,
  leads_qualified INT DEFAULT 0,
  leads_booked INT DEFAULT 0,
  leads_won INT DEFAULT 0,
  leads_lost INT DEFAULT 0,
  avg_response_time_sec INT,
  cost_per_lead DECIMAL(10,2),
  -- Advertising
  ad_spend DECIMAL(10,2) DEFAULT 0,
  ad_revenue DECIMAL(10,2) DEFAULT 0,
  ad_roas DECIMAL(5,2),
  ad_clicks INT DEFAULT 0,
  ad_impressions INT DEFAULT 0,
  -- Reputation
  reviews_received INT DEFAULT 0,
  reviews_responded INT DEFAULT 0,
  avg_review_score DECIMAL(3,2),
  total_reviews INT DEFAULT 0,
  -- SEO
  organic_traffic INT DEFAULT 0,
  keywords_ranking INT DEFAULT 0,
  top_keyword TEXT,
  top_keyword_position INT,
  -- Operations
  admin_hours_saved DECIMAL(5,2) DEFAULT 0,
  workflows_executed INT DEFAULT 0,
  -- Overall
  foundation_score INT,
  pipeline_value DECIMAL(12,2) DEFAULT 0,
  UNIQUE(client_id, date)
);

ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients see own metrics" ON daily_metrics FOR SELECT USING (
  client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
);

-- Agent activity log
CREATE TABLE IF NOT EXISTS agent_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  agent_name TEXT NOT NULL, -- cyrus, maven, orion, atlas, apex, nova
  action TEXT NOT NULL,
  details TEXT,
  category TEXT, -- lead, ad, review, seo, workflow, system, financial
  status TEXT DEFAULT 'completed', -- completed, pending_approval, failed, in_progress
  requires_approval BOOLEAN DEFAULT false,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE agent_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients see own agent activity" ON agent_activity FOR SELECT USING (
  client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  role TEXT NOT NULL, -- user, assistant
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- for action buttons, data cards in AI responses
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients see own chats" ON chat_messages FOR SELECT USING (
  client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Clients insert chats" ON chat_messages FOR INSERT WITH CHECK (
  client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  type TEXT NOT NULL, -- lead_new, lead_hot, review_new, review_negative, agent_action, advisor_message, report_ready, system_alert
  severity TEXT DEFAULT 'medium', -- low, medium, high, critical
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients see own notifications" ON notifications FOR SELECT USING (
  client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Clients update own notifications" ON notifications FOR UPDATE USING (
  client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
);

-- Hierarchy nodes (elastic hierarchy from diagnostic)
CREATE TABLE IF NOT EXISTS hierarchy_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  parent_id UUID REFERENCES hierarchy_nodes(id),
  layer_type TEXT NOT NULL, -- core_c1, core_c2, core_c3, ext_e1..ext_e7
  layer_position INT NOT NULL,
  node_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE hierarchy_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients see own hierarchy" ON hierarchy_nodes FOR SELECT USING (
  client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
);

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE agent_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE lead_interactions;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_interactions_client ON lead_interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_status ON lead_interactions(status);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_created ON lead_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_client_date ON daily_metrics(client_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_agent_activity_client ON agent_activity(client_id);
CREATE INDEX IF NOT EXISTS idx_agent_activity_created ON agent_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_client ON chat_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_client_read ON notifications(client_id, read);
CREATE INDEX IF NOT EXISTS idx_hierarchy_nodes_client ON hierarchy_nodes(client_id);
