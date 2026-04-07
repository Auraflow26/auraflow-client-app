# AuraFlow Client App — Claude Code Project Instructions

## WHAT THIS IS
The AuraFlow Client App is a Next.js 14 PWA that serves as the single interface where clients interact with their deployed AuraFlow operating system. It connects to Supabase (database), n8n (automation engine), and Claude API (chat intelligence).

## TECH STACK
- Framework: Next.js 14 (App Router, Server Components)
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS with AuraFlow brand kit
- Database: Supabase (PostgreSQL + Auth + Realtime + RLS)
- State: Zustand (global), React hooks (local)
- Charts: Recharts
- Icons: Lucide React
- AI Chat: Anthropic Claude API (claude-sonnet-4-20250514)
- Deployment: Vercel
- PWA: next-pwa

## SUPABASE PROJECT
- ID: bfzdcyuyilesubtgbhdc
- URL: https://bfzdcyuyilesubtgbhdc.supabase.co
- Existing tables: diagnostic_submissions, clients, heartbeat_log, audit_log, request_log, lead_interactions, system_metrics, webhook_events
- New tables needed: client_profiles, daily_metrics, agent_activity, chat_messages, notifications (see docs/supabase-schema.sql)

## DESIGN SYSTEM — MANDATORY
Every component must follow these rules. No exceptions.

### Colors (Tailwind custom):
- Backgrounds: bg (#030305), bg-secondary (#0a0a0f), bg-card (#0c0a12), bg-elevated (#141220)
- Accent: accent (#8b5cf6), accent-light (#a78bfa), accent-bright (#c4b5fd)
- Gold: #d4af37 (labels, section headers)
- Success: #10b981 (positive, healthy, green)
- Danger: #ef4444 (critical, negative, red)
- Warning: #f59e0b (caution, amber)
- Text: text-primary (#faf5ff), text-secondary (#c4b5fd), text-muted (#7c7291), text-dim (#4a4458)
- Borders: border (#rgba(139,92,246,0.12)), border-active (#rgba(139,92,246,0.35))

### Typography:
- Primary font: Space Grotesk (all text)
- Mono font: JetBrains Mono (numbers, labels, tags, code)
- Import both from Google Fonts in layout.tsx

### Rules:
- Dark theme ONLY. Never use white backgrounds or light mode.
- Purple accent for interactive elements, CTAs, active states
- JetBrains Mono for ALL numbers, metrics, scores, timestamps
- Border radius: 16px cards, 12px inputs, 100px pills/badges
- Borders: 1px solid rgba(139,92,246,0.12) default
- No gradients except subtle radial glows
- Glassmorphism: backdrop-blur-xl + bg-opacity on overlays only

## ACCESS HIERARCHY
- Level 1 (AuraFlow team): Full system access — NOT in this app
- Level 2 (Client owner): Dashboard + approval — THIS APP
- Level 3 (Client staff): Limited views — THIS APP (filtered)

## DATA RULES
- ALL data comes from Supabase. Never hardcode metrics, leads, or scores.
- Use seed data during development (see docs/seed-data.sql)
- RLS policies ensure multi-tenant isolation — every query is filtered by client_id
- The chat endpoint MUST ground all responses in actual data from the database
- Never fabricate statistics, quotes, or projections

## ARCHITECTURE RULES
- Server Components by default. Client Components only for interactivity (chat, filters, realtime).
- Zustand for global state (client profile, notification count). NOT React Context.
- Every API route must verify Supabase auth session before returning data.
- Use Supabase Realtime subscriptions for live activity feed on Home screen.
- Keep initial bundle under 200KB for mobile performance.
- All timestamps in client's local timezone.

## FILE NAMING
- Components: PascalCase (MetricCard.tsx, LeadCard.tsx)
- Hooks: camelCase with use prefix (useClient.ts, useMetrics.ts)
- Lib/utils: camelCase (supabase.ts, types.ts)
- Pages: page.tsx (Next.js convention)

## WHEN IN DOUBT
- Read the docs/ folder for detailed specs
- Check docs/app-blueprint.md for screen specifications
- Check docs/supabase-schema.sql for database structure
- Check docs/api-routes.md for endpoint specifications
- The app should feel like opening a command center for your business — not a generic dashboard template
