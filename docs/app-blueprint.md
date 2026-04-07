# AuraFlow Client App — Phase 1 PWA Sprint
## Complete Claude Code Prompt
## Target: Working web app in 14 days

---

## PROJECT SETUP

Create a new Next.js 14 application with the following stack:

```bash
npx create-next-app@latest auraflow-client-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

### Dependencies to install:
```bash
npm install @supabase/supabase-js @supabase/ssr
npm install recharts
npm install lucide-react
npm install date-fns
npm install zustand
npm install next-pwa
npm install @anthropic-ai/sdk
```

### Environment variables (.env.local):
```
NEXT_PUBLIC_SUPABASE_URL=https://bfzdcyuyilesubtgbhdc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[get from Supabase dashboard]
SUPABASE_SERVICE_ROLE_KEY=[get from Supabase dashboard]
ANTHROPIC_API_KEY=[Claude API key]
N8N_WEBHOOK_BASE=https://aurabazaar.app.n8n.cloud/webhook
NEXT_PUBLIC_APP_URL=https://app.auraflowusa.com
```

---

## DESIGN SYSTEM

Use Tailwind CSS with AuraFlow's brand kit as custom theme:

```javascript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#030305', secondary: '#0a0a0f', card: '#0c0a12', elevated: '#141220' },
        accent: { DEFAULT: '#8b5cf6', light: '#a78bfa', bright: '#c4b5fd', glow: 'rgba(139,92,246,0.15)' },
        gold: '#d4af37',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        text: { primary: '#faf5ff', secondary: '#c4b5fd', muted: '#7c7291', dim: '#4a4458' },
        border: { DEFAULT: 'rgba(139,92,246,0.12)', active: 'rgba(139,92,246,0.35)' },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '16px',
        pill: '100px',
      },
    },
  },
}
```

### Design rules:
- Dark theme ONLY — no light mode. Background #030305, cards #0c0a12
- Purple accent (#8b5cf6) for interactive elements, CTAs, active states
- Green (#10b981) for success, positive metrics, healthy status
- Red (#ef4444) for critical alerts, negative trends
- Gold (#d4af37) for labels, tags, section headers
- Space Grotesk for all text, JetBrains Mono for data/numbers/labels
- Border radius: 16px for cards, 12px for inputs, 100px for pills/badges
- Borders: 1px solid rgba(139,92,246,0.12) default
- No gradients except subtle radial glows for backgrounds
- Subtle glassmorphism on overlays (backdrop-blur-xl + semi-transparent bg)

---

## SUPABASE SCHEMA

The existing Supabase project (bfzdcyuyilesubtgbhdc) already has tables. Create these ADDITIONAL tables for the client app:

```sql
-- Client profiles (Level 2 users)
CREATE TABLE client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  industry TEXT,
  employee_count TEXT,
  complexity_score INT,
  foundation_score INT,
  hierarchy_depth INT DEFAULT 3,
  onboarded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON client_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Lead interactions (synced from n8n)
CREATE TABLE IF NOT EXISTS lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  lead_name TEXT,
  lead_email TEXT,
  lead_phone TEXT,
  source TEXT, -- google_ads, meta, angi, yelp, organic, referral, direct
  service_type TEXT,
  estimated_value DECIMAL(10,2),
  lead_score INT, -- 0-100
  status TEXT DEFAULT 'new', -- new, qualified, contacted, booked, won, lost
  follow_up_stage INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients see own leads" ON lead_interactions
  FOR SELECT USING (
    client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
  );

-- Daily metrics (aggregated by n8n nightly)
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  date DATE NOT NULL,
  leads_captured INT DEFAULT 0,
  leads_qualified INT DEFAULT 0,
  leads_booked INT DEFAULT 0,
  leads_won INT DEFAULT 0,
  avg_response_time_sec INT,
  ad_spend DECIMAL(10,2) DEFAULT 0,
  ad_revenue DECIMAL(10,2) DEFAULT 0,
  ad_roas DECIMAL(5,2),
  reviews_received INT DEFAULT 0,
  reviews_responded INT DEFAULT 0,
  avg_review_score DECIMAL(3,2),
  organic_traffic INT DEFAULT 0,
  keywords_ranking INT DEFAULT 0,
  admin_hours_saved DECIMAL(5,2) DEFAULT 0,
  foundation_score INT,
  UNIQUE(client_id, date)
);

ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients see own metrics" ON daily_metrics
  FOR SELECT USING (
    client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
  );

-- Agent activity log
CREATE TABLE agent_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  agent_name TEXT NOT NULL, -- cyrus, maven, orion, atlas, apex, nova
  action TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'completed', -- completed, pending_approval, failed
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE agent_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients see own agent activity" ON agent_activity
  FOR SELECT USING (
    client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
  );

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  role TEXT NOT NULL, -- user, assistant
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients see own chats" ON chat_messages
  FOR SELECT USING (
    client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Clients can insert chats" ON chat_messages
  FOR INSERT WITH CHECK (
    client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
  );

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  type TEXT NOT NULL, -- lead_new, lead_hot, review_new, review_negative, agent_action, advisor_message, report_ready
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients see own notifications" ON notifications
  FOR SELECT USING (
    client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Clients can update own notifications" ON notifications
  FOR UPDATE USING (
    client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
  );
```

Run this SQL in the Supabase SQL Editor for the project at https://supabase.com/dashboard/project/bfzdcyuyilesubtgbhdc

---

## APP STRUCTURE

```
src/
├── app/
│   ├── layout.tsx                    ← Root layout: fonts, metadata, PWA
│   ├── globals.css                   ← Tailwind + custom styles
│   ├── login/
│   │   └── page.tsx                  ← Magic link login
│   ├── auth/
│   │   └── callback/route.ts         ← Supabase auth callback
│   ├── (dashboard)/
│   │   ├── layout.tsx                ← Dashboard shell: bottom nav, header
│   │   ├── page.tsx                  ← HOME: The Pulse
│   │   ├── leads/
│   │   │   ├── page.tsx              ← Lead pipeline list
│   │   │   └── [id]/page.tsx         ← Lead detail
│   │   ├── reports/
│   │   │   └── page.tsx              ← Reports & Foundation Score
│   │   ├── chat/
│   │   │   └── page.tsx              ← Ask AuraFlow chat
│   │   ├── agents/
│   │   │   └── page.tsx              ← Agent status dashboard
│   │   └── settings/
│   │       └── page.tsx              ← Profile, notifications, team
│   └── api/
│       ├── chat/route.ts             ← Claude API chat endpoint
│       └── notifications/route.ts    ← Notification endpoints
├── components/
│   ├── ui/
│   │   ├── MetricCard.tsx            ← Stat card (number + label + trend)
│   │   ├── ActivityItem.tsx          ← Activity feed row
│   │   ├── LeadCard.tsx              ← Lead pipeline card
│   │   ├── AgentStatusCard.tsx       ← Agent health indicator
│   │   ├── ScoreGauge.tsx            ← Circular/bar score visualization
│   │   ├── Badge.tsx                 ← Status badges (hot, warm, cold)
│   │   ├── ChatBubble.tsx            ← Chat message bubble
│   │   └── BottomNav.tsx             ← Mobile bottom navigation
│   ├── charts/
│   │   ├── LeadTrend.tsx             ← Line chart for leads over time
│   │   ├── SourceBreakdown.tsx       ← Pie/bar for lead sources
│   │   ├── ScoreHistory.tsx          ← Foundation Score over time
│   │   └── MetricComparison.tsx      ← Before/after bar chart
│   └── layout/
│       ├── DashboardHeader.tsx       ← Top bar with business name + notifications
│       └── DashboardShell.tsx        ← Page wrapper with consistent padding
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 ← Browser Supabase client
│   │   ├── server.ts                 ← Server Supabase client (for API routes)
│   │   └── middleware.ts             ← Auth middleware
│   ├── store.ts                      ← Zustand global state
│   ├── types.ts                      ← All TypeScript interfaces
│   └── utils.ts                      ← Formatting, date helpers
├── hooks/
│   ├── useClient.ts                  ← Current client profile
│   ├── useMetrics.ts                 ← Dashboard metrics
│   ├── useLeads.ts                   ← Lead data + realtime
│   ├── useAgents.ts                  ← Agent status
│   └── useNotifications.ts           ← Notification count + list
└── middleware.ts                      ← Redirect unauthenticated to /login
```

---

## SCREEN SPECIFICATIONS

### LOGIN (/login)

Simple, branded login screen. Magic link only — no passwords.

- AuraFlow logo (purple "A" icon + "AuraFlow" text)
- Heading: "Welcome back"
- Subtext: "Enter your email to access your operating system"
- Email input field
- "Send magic link" button (purple, full width)
- On submit: call Supabase auth.signInWithOtp({ email })
- Success state: "Check your email — we sent you a login link"
- AuraFlow brand kit styling (dark bg, purple accent)

### HOME / THE PULSE (/)

The first screen after login. Must load in under 2 seconds.

**Header:**
- "Good morning, {first_name}." (time-aware greeting)
- Business name below in muted text
- Notification bell icon with unread count badge (top right)

**Metric cards (2x2 grid):**
- Leads today (number, green if > 0)
- Avg response time (seconds, green if < 60)
- Pipeline value (dollar amount, current month)
- Google reviews (total count, trend arrow)

Each card: dark bg (#0c0a12), 1px purple border, JetBrains Mono for the number, muted label below.

**Activity feed:**
- Real-time list from `agent_activity` table, ordered by created_at DESC
- Each item: colored dot (green = completed, purple = pending, red = failed) + action text + timestamp
- Tap to expand details
- "View all" link at bottom
- Use Supabase Realtime subscription to add new items live

**Ask AuraFlow (bottom):**
- Text input with placeholder "Ask about your business..."
- Tap opens /chat screen
- This is a shortcut, not inline chat

**Bottom navigation:**
- 5 tabs: Home (house icon), Leads (users icon), Reports (chart icon), Chat (message icon), More (menu icon)
- Active tab: purple icon + text, inactive: muted
- Fixed to bottom of viewport

### LEADS (/leads)

**Filter tabs:**
- [All] [New] [Qualified] [Booked] [Won] [Lost]
- Horizontal scroll, pill style, active = purple bg

**Lead list:**
- Cards sorted by created_at DESC
- Each card shows:
  - Lead name + location
  - Service type + estimated value
  - Source badge (Google Ads, Angi, Organic, etc.)
  - Lead score with color (90+ = red "Hot", 60-89 = amber "Warm", <60 = gray "Cold")
  - Current status + follow-up stage
  - Action buttons: [View] [Call] — Call triggers tel: link
- Empty state: "No leads yet. Your system is running — they'll appear here."

**Lead detail (/leads/[id]):**
- Full lead info
- Timeline of all touchpoints (qualification, follow-ups, calls)
- Source attribution
- Advisor notes (if any)
- Action buttons: Call, Email, Mark as Won/Lost

### REPORTS (/reports)

**Period selector:**
- [This Week] [This Month] [This Quarter] — pill toggle

**Foundation Score (hero card):**
- Large score number with circular gauge visualization
- Color: red (<30), orange (<50), purple (<70), green (70+)
- "↑ from {original_score} at diagnostic" below
- Use Recharts RadialBarChart

**Metric sections (scrollable):**
Each section has a JetBrains Mono gold label + metric rows:

Marketing:
- Leads this month: {count} ({trend}%)
- Cost per lead: ${amount} ({trend}%)
- Close rate: {pct}% ({trend}%)
- Ad spend ROI: {x}x

Operations:
- Avg response time: {sec} sec
- Follow-up completion: {pct}%
- Admin hours saved: {hrs} hrs/wk

Reputation:
- Google reviews: {count} (+{new})
- Avg rating: {score} ★
- Response rate: {pct}%

**Chart section:**
- Lead trend line chart (last 30 days) — Recharts LineChart
- Source breakdown bar chart — Recharts BarChart

### CHAT (/chat)

**Chat header:**
- "AuraFlow Intelligence" + green dot "Active"

**Message list:**
- Chat bubbles: user messages right-aligned (purple bg), AI messages left-aligned (card bg)
- AI messages can include:
  - Plain text responses
  - Action buttons (e.g., "Create surge playbook", "Shift budget")
  - Data cards (inline metric displays)
- Auto-scroll to bottom on new message
- Load chat history from `chat_messages` table

**Input area:**
- Text input with send button
- Placeholder: "Ask about your leads, ads, reviews, or anything..."

**API route (/api/chat/route.ts):**
```typescript
// 1. Get client profile from auth session
// 2. Fetch recent metrics from daily_metrics (last 30 days)
// 3. Fetch recent leads from lead_interactions (last 10)
// 4. Fetch recent agent activity (last 20)
// 5. Build system prompt with client context:

const systemPrompt = `You are AuraFlow Intelligence — the AI assistant for ${clientProfile.business_name}, 
a ${clientProfile.industry} business.

CURRENT METRICS (last 30 days):
- Leads captured: ${metrics.leads_captured}
- Avg response time: ${metrics.avg_response_time_sec} seconds
- Ad spend: $${metrics.ad_spend} | Revenue attributed: $${metrics.ad_revenue}
- Google reviews: ${metrics.total_reviews} (avg ${metrics.avg_rating} stars)
- Foundation Score: ${metrics.foundation_score}/100

RECENT LEADS:
${recentLeads.map(l => `- ${l.lead_name}: ${l.service_type}, $${l.estimated_value}, source: ${l.source}, status: ${l.status}`).join('\n')}

RECENT AGENT ACTIVITY:
${recentActivity.map(a => `- ${a.agent_name}: ${a.action} (${a.created_at})`).join('\n')}

RULES:
- Always ground your responses in the actual data above
- Never fabricate numbers or statistics
- If you don't have data to answer a question, say so honestly
- When recommending changes, note that they require advisor approval
- Keep responses concise and actionable — this is a mobile interface
- Use plain English that a non-technical business owner understands
- Reference specific data points when answering questions about performance`

// 6. Call Claude API with conversation history + system prompt
// 7. Save both user message and assistant response to chat_messages
// 8. Return assistant response
```

### AGENTS (/agents)

**Agent grid (6 cards):**
Each card shows:
- Agent avatar (colored circle with initial)
- Agent name + role
- Status: 🟢 Active / 🟡 Idle / 🔴 Error
- Key metric (e.g., "4 leads captured today" for Maven)
- Last heartbeat timestamp
- "View logs" link

**Agent colors:**
- Cyrus: #8b5cf6 (purple)
- Maven: #10b981 (green)
- Orion: #3b82f6 (blue)
- Atlas: #f59e0b (amber)
- Apex: #ef4444 (red)
- Nova: #8b5cf6 (purple-light)

**Data source:** Query `agent_activity` grouped by agent_name, last heartbeat from `heartbeat_log` table

### SETTINGS (/settings)

Simple list view:
- Profile section: business name, contact info (read-only for now)
- Notification preferences: toggles for push, email, SMS
- Connected tools: list of integrations with status indicators
- Advisor: name + contact info
- Help: link to auraflowusa.com/contact
- Logout button

---

## PWA CONFIGURATION

### next.config.js:
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

module.exports = withPWA({
  // ... existing next config
})
```

### public/manifest.json:
```json
{
  "name": "AuraFlow",
  "short_name": "AuraFlow",
  "description": "Your business operating system",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#030305",
  "theme_color": "#8b5cf6",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

This makes the app installable on both iOS ("Add to Home Screen") and Android.

---

## MIDDLEWARE (src/middleware.ts)

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip auth check for login and auth callback
  if (request.nextUrl.pathname.startsWith('/login') || 
      request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.next()
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookies) { /* handle cookie setting */ },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon-.*|manifest.json).*)'],
}
```

---

## REALTIME SUBSCRIPTIONS

Set up Supabase Realtime for live updates on the Home screen:

```typescript
// hooks/useRealtimeActivity.ts
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useStore } from '@/lib/store'

export function useRealtimeActivity(clientId: string) {
  const addActivity = useStore(s => s.addActivity)

  useEffect(() => {
    const channel = supabase
      .channel('agent_activity_realtime')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'agent_activity', filter: `client_id=eq.${clientId}` },
        (payload) => addActivity(payload.new)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [clientId, addActivity])
}
```

---

## DEPLOYMENT

### Vercel:
1. Push to GitHub repository
2. Connect to Vercel
3. Set environment variables
4. Deploy
5. Add custom domain: app.auraflowusa.com

### DNS:
Add CNAME record: app.auraflowusa.com → cname.vercel-dns.com

---

## 14-DAY SPRINT SCHEDULE

Day 1-2:   Project setup, Supabase schema, auth flow, middleware
Day 3-4:   Dashboard shell, bottom nav, Home/Pulse screen
Day 5-6:   Leads screen (list + detail + filtering)
Day 7-8:   Reports screen (Foundation Score, metrics, charts)
Day 9-10:  Chat screen (Claude API integration, message history)
Day 11:    Agents screen + Settings screen
Day 12:    PWA config, notifications, realtime subscriptions
Day 13:    Testing with RC Generators data, bug fixes
Day 14:    Deploy to Vercel, connect domain, onboard RC Generators

---

## SEED DATA FOR DEVELOPMENT

Until real data flows from n8n, seed the database with realistic RC Generators data:

```sql
-- Seed a test client profile
INSERT INTO client_profiles (user_id, client_id, business_name, contact_name, contact_email, industry, employee_count, complexity_score, foundation_score, hierarchy_depth)
VALUES (
  '[your-test-user-uuid]',
  '[rc-generators-client-uuid]',
  'RC Generators & Electric',
  'Robert Chen',
  'robert@rcgenerators.com',
  'home_services',
  '6-15',
  22,
  34,
  5
);

-- Seed sample leads
INSERT INTO lead_interactions (client_id, lead_name, lead_email, source, service_type, estimated_value, lead_score, status) VALUES
('[client-uuid]', 'Sarah Wilson', 'sarah@email.com', 'google_ads', 'Panel Upgrade', 4200, 87, 'qualified'),
('[client-uuid]', 'Mike Chen', 'mike@email.com', 'angi', 'Generator Install', 8500, 72, 'new'),
('[client-uuid]', 'Lisa Park', 'lisa@email.com', 'organic', 'EV Charger', 3800, 65, 'contacted');

-- Seed sample metrics (last 7 days)
INSERT INTO daily_metrics (client_id, date, leads_captured, leads_qualified, avg_response_time_sec, ad_spend, ad_roas, reviews_received, foundation_score) VALUES
('[client-uuid]', CURRENT_DATE - 6, 3, 2, 12, 67.50, 3.2, 1, 36),
('[client-uuid]', CURRENT_DATE - 5, 5, 3, 8, 72.00, 4.1, 0, 38),
('[client-uuid]', CURRENT_DATE - 4, 2, 1, 15, 58.00, 2.8, 2, 40),
('[client-uuid]', CURRENT_DATE - 3, 9, 6, 5, 95.00, 6.2, 1, 42),
('[client-uuid]', CURRENT_DATE - 2, 4, 3, 9, 71.00, 3.9, 0, 42),
('[client-uuid]', CURRENT_DATE - 1, 6, 4, 7, 82.00, 4.5, 1, 44),
('[client-uuid]', CURRENT_DATE, 4, 2, 8, 67.00, 3.8, 1, 45);

-- Seed agent activity
INSERT INTO agent_activity (client_id, agent_name, action, details, status) VALUES
('[client-uuid]', 'maven', 'Lead captured — Panel upgrade, Riverside', '$4,200 estimated value, score: 87', 'completed'),
('[client-uuid]', 'orion', 'Follow-up #2 sent', 'SMS to Sarah Wilson — personalized generator inquiry', 'completed'),
('[client-uuid]', 'atlas', 'Review responded', '5-star review auto-published', 'completed'),
('[client-uuid]', 'maven', 'Ad optimization applied', 'Budget shifted 15% to emergency campaign', 'pending_approval'),
('[client-uuid]', 'cyrus', 'Heartbeat — all systems nominal', '6 agents active, 0 errors', 'completed');
```

---

## IMPORTANT NOTES

- This is a REAL application, not a demo — all data comes from Supabase, not hardcoded
- RLS policies ensure clients ONLY see their own data — this is critical for multi-tenant security
- The Claude chat endpoint must NEVER fabricate data — it queries real metrics and grounds every response
- All timestamps should display in the client's local timezone
- The app must work on mobile Safari (iOS) and Chrome (Android) as a PWA
- Keep bundle size under 200KB initial load for fast mobile performance
- Use Zustand for global state (current client, notification count) — NOT React Context
- Use server components for data fetching where possible (Reports, Leads list)
- Use client components only where interactivity is needed (Chat, filters, realtime)
- Every API route must verify the user session via Supabase auth before returning data
