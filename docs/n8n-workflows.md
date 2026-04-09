# AuraFlow n8n Workflow Specs

Every workflow writes to the Supabase project `bfzdcyuyilesubtgbhdc`.
All inserts must include `client_id` (UUID from the `clients` table).
Use the Supabase service role key for all writes (bypasses RLS).

---

## WF-1: Lead Capture Pipeline

**Trigger:** Webhook (one per source) or Schedule (poll every 5 min)
**Purpose:** Capture new leads from all sources into `lead_interactions`
**Priority:** 🔴 Critical — the app is empty without this

### Sources to integrate:
| Source | Method | API/Webhook |
|--------|--------|-------------|
| Google Ads | Webhook or Google Sheets poll | Google Ads Lead Form Extension webhook |
| Google LSA | Poll | Google Local Services API |
| Meta Lead Ads | Webhook | Facebook Lead Ads webhook via Zapier or direct |
| Angi | Poll or Email parse | Angi email notifications → parse with AI |
| Yelp | Poll or Email parse | Yelp email notifications → parse |
| Thumbtack | Poll or Email parse | Thumbtack email notifications → parse |
| Website Form | Webhook | Direct webhook from contact form |
| Referral/Direct | Manual or CRM sync | Optional manual entry |

### Write to: `lead_interactions`
```json
{
  "client_id": "uuid-from-clients-table",
  "lead_name": "John Smith",
  "lead_email": "john@example.com",
  "lead_phone": "+15551234567",
  "lead_location": "Phoenix, AZ",
  "source": "google_ads",
  "service_type": "Generator Installation",
  "estimated_value": 8500.00,
  "lead_score": 0,
  "status": "new",
  "follow_up_stage": 0,
  "follow_up_history": [],
  "notes": "Requested quote for whole-home generator",
  "assigned_to": null
}
```

**Valid `source` values:** `google_ads`, `meta`, `angi`, `yelp`, `organic`, `referral`, `direct`, `lsa`, `thumbtack`

**Valid `status` values:** `new`, `qualified`, `contacted`, `booked`, `won`, `lost`

### Post-insert actions:
1. Call `POST /api/chat/actions` with `{ "action": "analyze_lead", "payload": { "lead_id": "<new-id>" } }` to trigger Shadow Score
2. Insert a notification (see WF-5)

---

## WF-2: Daily Metrics Aggregation

**Trigger:** Schedule — every night at 11:55 PM client timezone
**Purpose:** Aggregate daily performance data into `daily_metrics`
**Priority:** 🔴 Critical — Pulse page, Reports, and Chat all depend on this

### Data sources to pull from:
| Metric | Source |
|--------|--------|
| `leads_captured` | COUNT from `lead_interactions` WHERE `created_at` = today |
| `leads_qualified` | COUNT from `lead_interactions` WHERE `qualified_at` = today |
| `leads_booked` | COUNT from `lead_interactions` WHERE `booked_at` = today |
| `leads_won` | COUNT from `lead_interactions` WHERE `won_at` = today |
| `leads_lost` | COUNT from `lead_interactions` WHERE `lost_at` = today |
| `avg_response_time_sec` | From CRM/call tracking API — average seconds to first response |
| `cost_per_lead` | `ad_spend / leads_captured` (calculated) |
| `ad_spend` | Google Ads API + Meta Ads API — sum daily spend |
| `ad_revenue` | Google Ads API + Meta Ads API — sum conversions value |
| `ad_roas` | `ad_revenue / ad_spend` (calculated) |
| `ad_clicks` | Google Ads API + Meta Ads API — sum clicks |
| `ad_impressions` | Google Ads API + Meta Ads API — sum impressions |
| `reviews_received` | Google Business Profile API — new reviews today |
| `reviews_responded` | Google Business Profile API — reviews responded today |
| `avg_review_score` | Google Business Profile API — current average |
| `total_reviews` | Google Business Profile API — total count |
| `organic_traffic` | Google Analytics API or Google Search Console |
| `keywords_ranking` | Google Search Console — keywords in top 10 |
| `top_keyword` | Google Search Console — best performing keyword |
| `top_keyword_position` | Google Search Console — position of top keyword |
| `admin_hours_saved` | COUNT of `agent_activity` today × estimated time saved per action |
| `workflows_executed` | COUNT of `agent_activity` WHERE `status` = 'completed' today |
| `foundation_score` | Latest from `diagnostic_results` or carry forward from yesterday |
| `pipeline_value` | SUM of `estimated_value` from `lead_interactions` WHERE `status` IN ('new','qualified','contacted','booked') |

### Write to: `daily_metrics`
```json
{
  "client_id": "uuid",
  "date": "2026-04-07",
  "leads_captured": 5,
  "leads_qualified": 3,
  "leads_booked": 1,
  "leads_won": 1,
  "leads_lost": 0,
  "avg_response_time_sec": 45,
  "cost_per_lead": 32.50,
  "ad_spend": 162.50,
  "ad_revenue": 850.00,
  "ad_roas": 5.23,
  "ad_clicks": 87,
  "ad_impressions": 2340,
  "reviews_received": 1,
  "reviews_responded": 1,
  "avg_review_score": 4.7,
  "total_reviews": 142,
  "organic_traffic": 312,
  "keywords_ranking": 8,
  "top_keyword": "generator installation phoenix",
  "top_keyword_position": 3,
  "admin_hours_saved": 2.5,
  "workflows_executed": 12,
  "foundation_score": 67,
  "pipeline_value": 42500.00
}
```

Use **UPSERT** on `(client_id, date)` so re-runs don't create duplicates.

---

## WF-3: Agent Activity Logger

**Trigger:** Called by other workflows (sub-workflow) OR webhook from automation scripts
**Purpose:** Log every autonomous action to `agent_activity`
**Priority:** 🔴 Critical — Agents page and Pulse feed depend on this

### When to log:
- Lead follow-up sent (SMS, email, voicemail)
- Ad campaign adjusted
- Review response drafted or posted
- Content created or audited
- SEO task completed
- Any workflow execution

### Write to: `agent_activity`
```json
{
  "client_id": "uuid",
  "agent_name": "maven",
  "action": "Drafted follow-up email for Lead #422",
  "details": "Personalized email based on generator installation inquiry. Sent via SendGrid.",
  "category": "lead",
  "status": "completed",
  "requires_approval": false,
  "approved_by": null,
  "approved_at": null,
  "metadata": {
    "lead_id": "uuid-of-lead",
    "channel": "email",
    "template": "follow_up_v2"
  }
}
```

**Valid `agent_name` values:** `cyrus`, `maven`, `orion`, `atlas`, `apex`, `nova`

| Agent | Role | Logs when... |
|-------|------|-------------|
| `cyrus` | Chief Orchestrator | Workflow triggered, content pipeline started, system decisions |
| `maven` | Marketing Intelligence | Ad optimized, campaign paused/boosted, audience updated |
| `orion` | Operations Intelligence | Lead follow-up sent, appointment scheduled, pipeline updated |
| `atlas` | Administrative Intelligence | Report generated, invoice sent, admin task completed |
| `apex` | Human Performance | Training sent, performance alert, team metric updated |
| `nova` | Finance & Legal | Budget alert, compliance check, financial report |

**Valid `category` values:** `lead`, `ad`, `review`, `seo`, `workflow`, `system`, `financial`

**Valid `status` values:** `completed`, `pending_approval`, `failed`, `in_progress`

---

## WF-4: Lead Follow-Up Sequence

**Trigger:** Schedule — every 15 minutes
**Purpose:** Automatically follow up with leads based on their stage
**Priority:** 🟠 High — core automation value prop

### Logic:
```
1. Query leads WHERE status IN ('new', 'qualified', 'contacted')
   AND follow_up_stage < 5
   AND last follow_up was > threshold ago

2. For each lead:
   Stage 0 (new, 0-5 min):    → SMS: "Thanks for reaching out..."
   Stage 1 (30 min):          → Email: Personalized service info
   Stage 2 (4 hours):         → Voicemail drop
   Stage 3 (24 hours):        → SMS: "Just following up..."
   Stage 4 (72 hours):        → Email: Last chance / special offer

3. After sending, UPDATE lead_interactions:
   - Increment follow_up_stage
   - Append to follow_up_history array
   - Update updated_at

4. Log to agent_activity (call WF-3):
   agent_name: "orion"
   action: "Sent stage {n} follow-up to {lead_name}"
   category: "lead"
```

### Update `lead_interactions.follow_up_history`:
```json
{
  "stage": 1,
  "channel": "sms",
  "content": "Hi John, thanks for reaching out about generator installation...",
  "sent_at": "2026-04-07T14:30:00Z",
  "opened": false
}
```

---

## WF-5: Notification Dispatcher

**Trigger:** Called by other workflows (sub-workflow)
**Purpose:** Insert notifications that appear in the client app
**Priority:** 🟠 High — feeds the notification bell + notification page

### Write to: `notifications`
```json
{
  "client_id": "uuid",
  "type": "lead_new",
  "severity": "high",
  "title": "New High-Value Lead",
  "body": "John Smith requested a quote for Generator Installation ($8,500)",
  "read": false,
  "action_url": "/leads/uuid-of-lead",
  "metadata": {
    "lead_id": "uuid",
    "source": "google_ads"
  }
}
```

**Valid `type` values:** `lead_new`, `lead_hot`, `review_new`, `review_negative`, `agent_action`, `advisor_message`, `report_ready`, `system_alert`

**Valid `severity` values:** `low`, `medium`, `high`, `critical`

### When to fire:
| Event | Type | Severity |
|-------|------|----------|
| New lead captured | `lead_new` | `medium` |
| Lead score > 80 | `lead_hot` | `high` |
| New Google review | `review_new` | `medium` |
| Review < 3 stars | `review_negative` | `critical` |
| Agent needs approval | `agent_action` | `high` |
| Daily report ready | `report_ready` | `low` |
| Ad budget exceeded | `system_alert` | `critical` |
| Foundation score dropped | `system_alert` | `high` |

---

## WF-6: Google Reviews Monitor

**Trigger:** Schedule — every 30 minutes
**Purpose:** Monitor Google Business Profile for new reviews
**Priority:** 🟠 High — feeds Reviews metric + triggers review response

### Flow:
```
1. Poll Google Business Profile API for reviews since last check
2. For each new review:
   a. If rating >= 4:
      - Draft thank-you response via Claude
      - Log agent_activity (agent: "orion", category: "review")
      - Insert notification (type: "review_new", severity: "medium")
   b. If rating < 3:
      - Draft damage-control response via Claude
      - Set requires_approval: true on agent_activity
      - Insert notification (type: "review_negative", severity: "critical")
   c. Post response to Google (if auto-approve enabled)
      OR hold for client approval
```

---

## WF-7: Ad Platform Sync

**Trigger:** Schedule — every 6 hours
**Purpose:** Pull ad performance data for metrics + chat grounding
**Priority:** 🟡 Medium — enriches daily_metrics

### Sources:
- **Google Ads API** → spend, clicks, impressions, conversions, ROAS
- **Meta Ads API** → spend, clicks, impressions, conversions, ROAS
- **Google LSA** → leads, spend (if applicable)

### Flow:
```
1. Pull today's data from each platform
2. Store raw data in agent_activity as metadata
   (agent: "maven", action: "Synced ad performance data")
3. Data feeds into WF-2 (Daily Metrics) at end of day
4. If ROAS drops below threshold → trigger notification (WF-5)
5. If CPC spikes > 20% vs 7-day avg → trigger notification
```

---

## WF-8: Client Onboarding

**Trigger:** Manual or webhook (when new client signs contract)
**Purpose:** Provision a new client in the system
**Priority:** 🔴 Critical — required before any client can use the app

### Flow:
```
1. Receive: business_name, contact_name, contact_email, industry,
            employee_count, website_url

2. INSERT into clients table (if not using existing)

3. INSERT into client_profiles:
   {
     user_id: null,          ← filled when they first log in
     client_id: <from step 2>,
     business_name, contact_name, contact_email,
     industry, employee_count,
     complexity_score: 0,
     foundation_score: 0,
     hierarchy_depth: 3
   }

4. Run initial diagnostic scan:
   POST /api/scan with { business_name, website_url, vertical }

5. Generate hierarchy_nodes (default 3-layer structure)

6. Send magic link invitation email to contact_email

7. Backfill daily_metrics with any available historical data
   (Google Ads, Meta, Google Reviews history)

8. Insert welcome notification:
   {
     type: "system_alert",
     severity: "low",
     title: "Welcome to AuraFlow",
     body: "Your operating system is live. Start by reviewing your Pulse."
   }
```

---

## WF-9: Weekly Report Generator

**Trigger:** Schedule — Monday 8:00 AM client timezone
**Purpose:** Generate weekly summary + trigger report notification
**Priority:** 🟡 Medium

### Flow:
```
1. Query daily_metrics for last 7 days
2. Aggregate: total leads, wins, close rate, ad spend, ROAS, reviews
3. Compare vs previous week
4. Call Claude to generate a 3-paragraph executive summary
5. Store in agent_activity:
   agent: "atlas", action: "Generated weekly report"
6. Insert notification:
   type: "report_ready", title: "Weekly Report Ready"
   action_url: "/reports"
```

---

## WF-10: Heartbeat / Health Check

**Trigger:** Schedule — every 5 minutes
**Purpose:** Verify all integrations are connected and healthy
**Priority:** 🟡 Medium

### Flow:
```
1. Check each integration:
   - Google Ads API: authenticated?
   - Meta Ads API: authenticated?
   - Google Business Profile: accessible?
   - Supabase: writable?
   - Claude API: responding?

2. For each agent, insert heartbeat:
   agent_activity: {
     agent_name: "cyrus",
     action: "System heartbeat",
     details: "All 5 integrations healthy",
     category: "system",
     status: "completed"
   }

3. If any integration fails:
   - Insert notification (severity: "critical")
   - Log agent_activity with status: "failed"
```

---

## Workflow Dependency Map

```
WF-8 (Onboarding)
  └── runs first for each new client

WF-1 (Lead Capture) ──────┐
  ├── calls WF-3 (Logger)  │
  ├── calls WF-5 (Notify)  │
  └── triggers WF-4        │
                            ├──► WF-2 (Daily Metrics) runs at EOD
WF-6 (Reviews) ───────────┤     aggregates everything
  ├── calls WF-3 (Logger)  │
  └── calls WF-5 (Notify)  │
                            │
WF-7 (Ad Sync) ───────────┘
  ├── calls WF-3 (Logger)
  └── calls WF-5 (Notify)

WF-4 (Follow-Up Sequence)
  ├── calls WF-3 (Logger)
  └── reads lead_interactions

WF-9 (Weekly Report) — standalone, reads daily_metrics
WF-10 (Heartbeat) — standalone, writes agent_activity
```

---

## Build Order (recommended)

```
Phase 1 — App works with data:
  1. WF-8  Client Onboarding (provision first customer)
  2. WF-1  Lead Capture (at least 1 source — Google Ads or website form)
  3. WF-3  Agent Activity Logger (sub-workflow, used by everything)
  4. WF-5  Notification Dispatcher (sub-workflow, used by everything)
  5. WF-2  Daily Metrics Aggregation

Phase 2 — Core automation:
  6. WF-4  Lead Follow-Up Sequence
  7. WF-6  Google Reviews Monitor

Phase 3 — Enrichment:
  8. WF-7  Ad Platform Sync
  9. WF-9  Weekly Report Generator
  10. WF-10 Heartbeat / Health Check
```

---

## Supabase Connection Config (for all workflows)

```
Host: https://bfzdcyuyilesubtgbhdc.supabase.co
API Key: Use SERVICE_ROLE_KEY (bypasses RLS for server-side writes)
Headers:
  apikey: <service_role_key>
  Authorization: Bearer <service_role_key>
  Content-Type: application/json
  Prefer: return=representation
```

Insert example:
```
POST https://bfzdcyuyilesubtgbhdc.supabase.co/rest/v1/lead_interactions
```
