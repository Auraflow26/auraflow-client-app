# AuraFlow Client App — Internal Documentation

Engineering reference for the team. Covers architecture, data flow, auth, design system, and operations.

---

## 1. What this app is

A **Next.js 14 App Router PWA** — a single mobile-first command center where client business owners (Level 2 users) interact with their deployed AuraFlow operating system. It is NOT the AuraFlow team console (that's a separate Level 1 app).

**Users:** Level 2 (client owners, full dashboard + approvals) and Level 3 (client staff, filtered views). Level 1 AuraFlow team members do not use this app.

**External dependencies:**
- Supabase `bfzdcyuyilesubtgbhdc` — database, auth, realtime, RLS
- n8n (`aurabazaar.app.n8n.cloud`) — writes to `lead_interactions`, `agent_activity`, `daily_metrics`, `notifications`
- Anthropic Claude API (`claude-sonnet-4-20250514`) — grounds chat responses in Supabase data

---

## 2. Architecture at a glance

```
┌──────────────────────────────────────────────────┐
│  Client (browser / installed PWA)               │
│  ─ React Server Components fetch via Supabase   │
│  ─ Client Components: chat, filters, realtime   │
│  ─ Zustand store: profile, unreadCount, activity│
└─────────────┬────────────────────────────────────┘
              │ HTTPS
┌─────────────▼────────────────────────────────────┐
│  Next.js middleware (edge)                       │
│  ─ refreshes Supabase session cookies            │
│  ─ redirects unauthenticated → /login            │
└─────────────┬────────────────────────────────────┘
              │
      ┌───────┴────────┐
      ▼                ▼
┌──────────┐    ┌──────────────┐
│ RSC data │    │ /api/chat    │
│ fetches  │    │ Claude API   │
└────┬─────┘    └──────┬───────┘
     │                 │
     ▼                 ▼
┌──────────────────────────────┐
│  Supabase (RLS by client_id) │
│  ─ Realtime on 3 tables      │
└──────────────────────────────┘
              ▲
              │ writes
       ┌──────┴──────┐
       │ n8n flows   │
       └─────────────┘
```

**Rendering strategy:** Server Components by default. All page-level data fetches happen server-side so the first paint is data-complete. Only pages that need interactivity (chat, filters, realtime feed) use `'use client'` child components hydrated from server-fetched initial state.

---

## 3. File map

```
src/
├─ app/
│  ├─ layout.tsx               Root shell: fonts, PWA metadata, viewport
│  ├─ globals.css              Tailwind + scrollbar + .glass + .radial-glow
│  ├─ login/page.tsx           Magic-link auth, no passwords
│  ├─ auth/callback/route.ts   OAuth code → session exchange
│  ├─ not-found.tsx            Branded 404
│  ├─ (dashboard)/
│  │  ├─ layout.tsx            Auth guard + AppProvider + BottomNav
│  │  ├─ page.tsx              Home / Pulse (server)
│  │  ├─ PulseView.tsx         Home interactivity + realtime merge
│  │  ├─ leads/page.tsx        Leads list (server)
│  │  ├─ leads/LeadsView.tsx   Filter tabs (client)
│  │  ├─ leads/[id]/page.tsx   Lead detail + timeline
│  │  ├─ reports/page.tsx      Reports (server — 90d window)
│  │  ├─ reports/ReportsView.tsx  Period toggle, aggregates, charts
│  │  ├─ chat/page.tsx         Loads history (server)
│  │  ├─ chat/ChatView.tsx     Chat UI (client)
│  │  ├─ agents/page.tsx       6 agent status + 24h activity
│  │  ├─ settings/page.tsx     Profile, advisor, help
│  │  └─ settings/LogoutButton.tsx
│  └─ api/chat/route.ts        Claude endpoint with DB grounding
├─ components/
│  ├─ ui/                      MetricCard, Badge, LeadCard, ActivityItem,
│  │                           ChatBubble, BottomNav, AgentStatusCard, ScoreGauge
│  ├─ charts/                  LeadTrend, SourceBreakdown, ScoreHistory,
│  │                           MetricComparison (all Recharts, client-only)
│  └─ layout/                  DashboardHeader, DashboardShell, AppProvider
├─ hooks/
│  ├─ useClient.ts             Lazy-load profile into Zustand
│  ├─ useRealtimeActivity.ts   Subscribes to agent_activity INSERTs
│  └─ useNotifications.ts      Loads notifications + INSERT subscription
├─ lib/
│  ├─ supabase/
│  │  ├─ client.ts             Browser client
│  │  ├─ server.ts             Server client (reads cookies via next/headers)
│  │  └─ middleware.ts         Session refresher (NextRequest/NextResponse)
│  ├─ store.ts                 Zustand global state
│  ├─ types.ts                 All domain types + AGENTS + LEAD_SOURCES
│  └─ utils.ts                 cn, formatters, greeting, scoreColor, badges
└─ middleware.ts               Wraps updateSession for all non-asset routes
```

---

## 4. Auth flow

```
User enters email  →  supabase.auth.signInWithOtp({ email })
                      emailRedirectTo: /auth/callback
User clicks link   →  /auth/callback?code=…
Route handler      →  exchangeCodeForSession(code)
                      sets auth cookies
                      redirect → /
Middleware         →  reads cookies, refreshes session
                      if no user on non-public route → /login
```

**Important:**
- Middleware config matcher excludes `_next/static`, `_next/image`, `favicon.ico`, `icon-*`, `manifest.json`, `sw.js`, `workbox-*`.
- Server components use `createClient()` from `lib/supabase/server.ts`, which reads cookies via `next/headers` (must be a new client per request).
- The dashboard layout re-checks `auth.getUser()` itself and redirects — defense in depth. Middleware alone is not enough for server components.

---

## 5. Data model & RLS

All new tables are in [docs/supabase-schema.sql](supabase-schema.sql). Every row has `client_id`. Every RLS policy filters by:

```sql
client_id IN (SELECT client_id FROM client_profiles WHERE user_id = auth.uid())
```

This is the multi-tenant boundary. **Never bypass it with the service role key in user-facing code paths.** The service role key should only appear in admin scripts or n8n webhook handlers.

**Tables written by n8n:** `lead_interactions`, `agent_activity`, `daily_metrics`, `notifications`, `heartbeat_log`.
**Tables written by app:** `chat_messages` (user+assistant pairs), eventually `notifications.read` updates.
**Tables the app only reads:** everything else.

**Realtime enabled on:** `agent_activity`, `lead_interactions`, `notifications`. The app subscribes only to `agent_activity` (home feed) and `notifications` (unread count) today. Adding lead realtime is a ~10 line hook when needed.

---

## 6. Chat grounding contract

`POST /api/chat` is the only write path for AI content. It:

1. Verifies Supabase session, loads the user's `client_profile`.
2. Fetches in parallel:
   - last 30 days of `daily_metrics`
   - 10 most-recent `lead_interactions`
   - last 30 days of `agent_activity` (capped at 20 rows)
   - last 20 `chat_messages` for conversation memory
3. Aggregates metrics (leads, wins, ad spend/revenue, ROAS, avg response, admin hours, reviews).
4. Builds a system prompt that embeds the numbers verbatim and includes the rule: **"Always ground responses in the actual data above. Never fabricate numbers."**
5. Calls `claude-sonnet-4-20250514` with `max_tokens: 1024`.
6. Persists both user and assistant messages to `chat_messages`.

**If you change the system prompt, review it against the "never fabricate" rule.** The model is only as honest as the prompt makes it.

**Model ID note:** per project convention we use `claude-sonnet-4-20250514`. Update via env var before swapping model versions in prod.

---

## 7. State management

- **Server-fetched data** lives in page props — it's authoritative and re-fetched on navigation.
- **Zustand** holds UI-layer state that needs to survive hydration and stay in sync with realtime:
  - `profile` — current `ClientProfile`, set once by `AppProvider`.
  - `activity` — merged realtime feed; the Pulse view seeds this from server data then lets realtime inserts push new rows.
  - `unreadCount`, `notifications` — populated by `useNotifications` hook.
- **Do not use React Context** for global state. Zustand is the project standard.
- **Client data deduping:** if a realtime INSERT arrives for an activity already in the seed, `addActivity` will prepend a duplicate. For v1 this is acceptable (activity IDs are unique; we slice to 50). Add dedup-by-id before enabling long-lived feeds.

---

## 8. Design system enforcement

Defined in [tailwind.config.ts](../tailwind.config.ts). All colors, fonts, and radii come from the theme — do not hardcode hex values in components except inside chart config (where Recharts needs string values).

**Mandatory rules (from CLAUDE.md):**
- Dark theme only. `bg-bg` is `#030305`, `bg-bg-card` is `#0c0a12`.
- JetBrains Mono for **every number, score, timestamp, label, and tag**. Space Grotesk for prose.
- Purple `accent` for interactive elements and active states.
- `rounded-card` (16px) for cards, `rounded-input` (12px) for inputs, `rounded-pill` (100px) for badges/tabs.
- Borders default to `rgba(139,92,246,0.12)`; active/hover → `rgba(139,92,246,0.35)`.
- `.glass` utility (backdrop-blur-xl + semi-transparent) for sticky headers and bottom nav only.
- No gradients except the `.radial-glow` background.

Reusable primitives live in `components/ui/`. When in doubt, extend an existing primitive rather than inlining styles.

---

## 9. PWA configuration

- Manifest: [public/manifest.json](../public/manifest.json) — `display: standalone`, theme `#8b5cf6`, bg `#030305`.
- `next-pwa` generates `/sw.js` at build time. Disabled in dev.
- Viewport in root layout has `userScalable: false` (matches installed-app feel).
- **Missing:** `public/icon-192.png` and `public/icon-512.png`. PWA installs will fail until those are added.

---

## 10. Environment variables

| Var | Where used | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | all Supabase clients | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | all Supabase clients | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | (reserved — not currently used) | — |
| `ANTHROPIC_API_KEY` | `/api/chat` | ✅ |
| `N8N_WEBHOOK_BASE` | (reserved for future webhook triggers) | — |
| `NEXT_PUBLIC_APP_URL` | PWA deep links, future email templates | ✅ |

Never commit `.env.local`. Template is at [.env.example](../.env.example).

---

## 11. Build & deploy

**Local:**
```bash
npm install
cp .env.example .env.local   # then fill in values
npm run dev                   # http://localhost:3000
npm run build                 # production build
```

**Production (Vercel):**
- Framework preset: Next.js
- Env vars: set all required vars above in Vercel project settings.
- Custom domain: `app.auraflowusa.com` via CNAME → `cname.vercel-dns.com`.
- The build auto-generates the PWA service worker; no extra config.

**Current build footprint** (from last successful build): middleware 78.8 kB, shared JS 87.4 kB, Home first-load 103 kB. Reports is the heaviest route at 213 kB first-load (Recharts). Keep this in mind if adding more chart-heavy pages.

---

## 12. Known gaps / TODO

- No service worker for `/api/chat` offline queue yet.
- `SUPABASE_SERVICE_ROLE_KEY` is declared but unused — wire it up only for server-to-server jobs.
- Notification UI: bell count is live, but there's no notification list/drawer page yet (bell currently links to settings).
- Lead mutations (status change, notes) are read-only in v1. RLS `UPDATE` policies are already in place.
- Chat action buttons (inline `actions` metadata) are rendered but not yet wired to real handlers.
- No unit tests. E2E with Playwright is the planned next step.
- PWA icons not yet in `public/`.

---

## 13. Conventions

- **Files:** Components PascalCase; hooks `useXxx` camelCase; lib/utils camelCase; pages `page.tsx`.
- **Server vs client:** add `'use client'` only when needed (state, effects, event handlers, Recharts, Supabase realtime).
- **Time:** all timestamps stored UTC in Supabase, displayed in client local time via `date-fns`.
- **Money:** `formatCurrency` in `lib/utils.ts` — pass `compact: true` for dashboard tiles.
- **Empty states:** every list must have an empty-state message that reassures the user the system is working.
- **Error handling:** the chat endpoint returns `{ error }`; the client shows a soft "something went wrong" message. Fail closed but friendly.

---

## 14. Who to contact

- Supabase schema / migrations → database owner
- n8n flows writing into our tables → automation lead
- Claude prompt tuning → product + AI lead
- Design system changes → design lead (any change to colors/radii/fonts is a design-review item, not a dev decision)
