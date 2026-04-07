-- AuraFlow Client App — Seed Data for Development
-- Replace [TEST-USER-UUID] with the UUID from Supabase Auth after creating a test user
-- Replace [RC-CLIENT-UUID] with the UUID from the clients table for RC Generators

-- Step 1: Create a test user via Supabase Auth dashboard first
-- Go to Authentication → Users → Create User → use mo@auraflowusa.com

-- Step 2: Insert client profile (replace UUIDs)
INSERT INTO client_profiles (user_id, client_id, business_name, contact_name, contact_email, contact_phone, industry, employee_count, revenue_range, complexity_score, foundation_score, hierarchy_depth, advisor_name, advisor_email)
VALUES (
  '[TEST-USER-UUID]',
  '[RC-CLIENT-UUID]',
  'RC Generators & Electric',
  'Robert Chen',
  'robert@rcgenerators.com',
  '+1-951-555-0142',
  'home_services',
  '6-15',
  '500k-1m',
  22,
  34,
  5,
  'Mo',
  'mo@auraflowusa.com'
);

-- Step 3: Seed leads
INSERT INTO lead_interactions (client_id, lead_name, lead_email, lead_phone, lead_location, source, service_type, estimated_value, lead_score, status, follow_up_stage, created_at) VALUES
('[RC-CLIENT-UUID]', 'Sarah Wilson', 'sarah.wilson@email.com', '+1-951-555-0201', 'Riverside, CA', 'google_ads', 'Panel Upgrade', 4200, 87, 'qualified', 2, now() - interval '2 hours'),
('[RC-CLIENT-UUID]', 'Mike Chen', 'mike.chen@email.com', '+1-909-555-0302', 'Corona, CA', 'angi', 'Generator Install', 8500, 72, 'new', 0, now() - interval '4 hours'),
('[RC-CLIENT-UUID]', 'Lisa Park', 'lisa.park@email.com', '+1-951-555-0403', 'Temecula, CA', 'organic', 'EV Charger Install', 3800, 65, 'contacted', 1, now() - interval '1 day'),
('[RC-CLIENT-UUID]', 'James Rodriguez', 'james.r@email.com', '+1-760-555-0504', 'Murrieta, CA', 'google_ads', 'Whole House Rewire', 12000, 91, 'booked', 3, now() - interval '2 days'),
('[RC-CLIENT-UUID]', 'Amy Foster', 'amy.foster@email.com', '+1-951-555-0605', 'Riverside, CA', 'referral', 'Panel Upgrade', 3500, 58, 'won', 4, now() - interval '5 days'),
('[RC-CLIENT-UUID]', 'David Kim', 'david.k@email.com', '+1-909-555-0706', 'Ontario, CA', 'meta', 'Generator Maintenance', 800, 42, 'lost', 2, now() - interval '7 days'),
('[RC-CLIENT-UUID]', 'Rachel Torres', 'rachel.t@email.com', '+1-951-555-0807', 'Perris, CA', 'lsa', 'Emergency Panel Repair', 2200, 95, 'new', 0, now() - interval '30 minutes');

-- Step 4: Seed daily metrics (last 14 days)
INSERT INTO daily_metrics (client_id, date, leads_captured, leads_qualified, leads_booked, leads_won, avg_response_time_sec, cost_per_lead, ad_spend, ad_revenue, ad_roas, reviews_received, reviews_responded, avg_review_score, total_reviews, organic_traffic, keywords_ranking, admin_hours_saved, workflows_executed, foundation_score, pipeline_value) VALUES
('[RC-CLIENT-UUID]', CURRENT_DATE - 13, 2, 1, 0, 0, 45, 89.00, 178.00, 0, 0, 0, 0, 4.7, 59, 34, 17, 1.5, 12, 34, 8500),
('[RC-CLIENT-UUID]', CURRENT_DATE - 12, 3, 2, 1, 0, 18, 67.00, 201.00, 3500, 3.5, 1, 1, 4.7, 60, 38, 18, 2.0, 18, 36, 12200),
('[RC-CLIENT-UUID]', CURRENT_DATE - 11, 5, 3, 1, 1, 12, 54.00, 270.00, 4200, 4.1, 0, 0, 4.7, 60, 42, 18, 2.2, 22, 38, 15800),
('[RC-CLIENT-UUID]', CURRENT_DATE - 10, 2, 1, 0, 0, 22, 78.00, 156.00, 0, 0, 1, 1, 4.8, 61, 39, 19, 1.8, 15, 38, 11200),
('[RC-CLIENT-UUID]', CURRENT_DATE - 9, 4, 3, 2, 0, 8, 52.00, 208.00, 8500, 6.2, 0, 0, 4.8, 61, 45, 19, 2.5, 28, 40, 18900),
('[RC-CLIENT-UUID]', CURRENT_DATE - 8, 3, 2, 1, 1, 11, 61.00, 183.00, 3800, 3.9, 1, 1, 4.8, 62, 41, 20, 2.1, 19, 40, 14500),
('[RC-CLIENT-UUID]', CURRENT_DATE - 7, 6, 4, 2, 1, 7, 48.00, 288.00, 12000, 5.8, 2, 2, 4.8, 64, 52, 21, 2.8, 34, 42, 22400),
('[RC-CLIENT-UUID]', CURRENT_DATE - 6, 3, 2, 1, 0, 9, 58.00, 174.00, 4200, 4.2, 0, 0, 4.8, 64, 44, 21, 2.0, 21, 42, 16800),
('[RC-CLIENT-UUID]', CURRENT_DATE - 5, 5, 3, 1, 1, 8, 51.00, 255.00, 8500, 5.1, 1, 1, 4.8, 65, 48, 22, 2.4, 26, 44, 19200),
('[RC-CLIENT-UUID]', CURRENT_DATE - 4, 2, 1, 0, 0, 15, 72.00, 144.00, 0, 0, 0, 0, 4.8, 65, 38, 22, 1.6, 14, 44, 12800),
('[RC-CLIENT-UUID]', CURRENT_DATE - 3, 9, 6, 3, 2, 5, 38.00, 342.00, 14200, 6.2, 1, 1, 4.8, 66, 61, 23, 3.2, 42, 46, 28500),
('[RC-CLIENT-UUID]', CURRENT_DATE - 2, 4, 3, 1, 0, 9, 55.00, 220.00, 4800, 4.5, 1, 1, 4.8, 67, 46, 23, 2.2, 24, 46, 17600),
('[RC-CLIENT-UUID]', CURRENT_DATE - 1, 6, 4, 2, 1, 7, 45.00, 270.00, 9200, 5.4, 1, 1, 4.9, 67, 53, 24, 2.6, 31, 48, 21800),
('[RC-CLIENT-UUID]', CURRENT_DATE, 4, 2, 1, 0, 8, 52.00, 208.00, 4200, 3.8, 1, 1, 4.9, 67, 47, 24, 2.1, 22, 48, 18700);

-- Step 5: Seed agent activity (recent)
INSERT INTO agent_activity (client_id, agent_name, action, details, category, status, created_at) VALUES
('[RC-CLIENT-UUID]', 'maven', 'Lead captured — Emergency panel repair', 'Rachel Torres, Perris CA. $2,200 est. Score: 95. Source: Google LSA.', 'lead', 'completed', now() - interval '30 minutes'),
('[RC-CLIENT-UUID]', 'orion', 'Follow-up #2 sent to Sarah Wilson', 'SMS: personalized panel upgrade inquiry. Open rate: tracking.', 'lead', 'completed', now() - interval '1 hour'),
('[RC-CLIENT-UUID]', 'atlas', 'Review responded — 5-star', '"Great work on the generator install!" Auto-published (positive).', 'review', 'completed', now() - interval '2 hours'),
('[RC-CLIENT-UUID]', 'maven', 'Ad budget optimization recommended', 'Shift 15% from generator campaign to emergency — emergency ROAS 6.2x vs generator 3.1x. Awaiting advisor approval.', 'ad', 'pending_approval', now() - interval '3 hours'),
('[RC-CLIENT-UUID]', 'nova', 'Monthly revenue report generated', 'March revenue: $47,200. Top service: Generator Install ($18,500). Margin analysis attached.', 'financial', 'completed', now() - interval '5 hours'),
('[RC-CLIENT-UUID]', 'apex', 'Team performance check — all clear', 'No burnout indicators detected. Workload distribution: balanced across 3 crews.', 'system', 'completed', now() - interval '8 hours'),
('[RC-CLIENT-UUID]', 'cyrus', 'System heartbeat — all nominal', '6 agents active. 0 errors. Uptime: 99.97%. Next optimization cycle: 6 AM.', 'system', 'completed', now() - interval '12 hours'),
('[RC-CLIENT-UUID]', 'maven', 'SEO milestone — panel upgrade page #4', '/panel-upgrade now ranks #4 for "panel upgrade Riverside CA". Up from #12 at onboarding.', 'seo', 'completed', now() - interval '1 day'),
('[RC-CLIENT-UUID]', 'orion', 'New workflow deployed — surge response', 'Weather alert trigger → auto-increase emergency ad budget 40% → activate priority routing. Pending advisor approval.', 'workflow', 'pending_approval', now() - interval '1 day');

-- Step 6: Seed hierarchy nodes
INSERT INTO hierarchy_nodes (client_id, layer_type, layer_position, node_name, is_active) VALUES
('[RC-CLIENT-UUID]', 'core_c1', 1, 'RC Generators & Electric', true),
('[RC-CLIENT-UUID]', 'ext_e4', 2, 'Residential Services', true),
('[RC-CLIENT-UUID]', 'ext_e5', 3, 'Generator Installation', true),
('[RC-CLIENT-UUID]', 'core_c2', 4, 'JOB-0142 Smith Residence', true),
('[RC-CLIENT-UUID]', 'core_c3', 5, 'Dispatch + 6hrs labor + $2,800 generator', true);

-- Step 7: Seed notifications
INSERT INTO notifications (client_id, type, severity, title, body, read, created_at) VALUES
('[RC-CLIENT-UUID]', 'lead_hot', 'critical', 'Hot lead — Emergency panel repair', 'Rachel Torres, Perris CA. Score: 95. $2,200. Auto-qualified and followed up.', false, now() - interval '30 minutes'),
('[RC-CLIENT-UUID]', 'agent_action', 'high', 'Budget optimization needs approval', 'Maven recommends shifting 15% from generator to emergency campaign. ROAS: 6.2x vs 3.1x.', false, now() - interval '3 hours'),
('[RC-CLIENT-UUID]', 'review_new', 'medium', 'New 5-star review', '"Great work on the generator install!" — responded automatically.', true, now() - interval '2 hours'),
('[RC-CLIENT-UUID]', 'report_ready', 'low', 'March revenue report ready', 'Revenue: $47,200. Top service: Generator Install. View in Reports.', true, now() - interval '5 hours');
