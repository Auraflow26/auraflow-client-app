-- Fix lead_interactions: drop old schema, recreate with correct columns
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New query

DROP TABLE IF EXISTS lead_interactions CASCADE;

CREATE TABLE lead_interactions (
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

ALTER PUBLICATION supabase_realtime ADD TABLE lead_interactions;

CREATE INDEX IF NOT EXISTS idx_lead_interactions_client ON lead_interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_status ON lead_interactions(status);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_created ON lead_interactions(created_at DESC);
