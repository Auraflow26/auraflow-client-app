# AuraFlow Client App

The single pane of glass for every AuraFlow client's business. PWA built with Next.js 14, Supabase, and Claude AI.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local
# Fill in your Supabase and Anthropic API keys

# 3. Run the Supabase schema
# Go to supabase.com/dashboard/project/bfzdcyuyilesubtgbhdc
# Open SQL Editor → paste contents of docs/supabase-schema.sql → Run

# 4. Seed development data
# SQL Editor → paste docs/seed-data.sql → Replace UUIDs → Run

# 5. Start development server
npm run dev
# Open http://localhost:3000
```

## Architecture

```
Client App (Next.js on Vercel)
    ↕ Supabase (PostgreSQL + Auth + Realtime)
    ↕ n8n Cloud (Automation Engine)
    ↕ Claude API (Chat Intelligence)
    ↕ Client's Tools (Google Ads, CRM, etc.)
```

## Screens

1. **Login** — Magic link authentication
2. **Home (The Pulse)** — Live metrics + activity feed
3. **Leads** — Pipeline view with scoring
4. **Reports** — Foundation Score + performance charts
5. **Chat** — AI-powered business intelligence assistant
6. **Agents** — 6 AI agent status dashboard
7. **Settings** — Profile, notifications, integrations

## Deployment

Push to GitHub → Vercel auto-deploys → Live at app.auraflowusa.com

## Documentation

- `CLAUDE.md` — Project instructions for Claude Code
- `docs/app-blueprint.md` — Full screen specifications
- `docs/supabase-schema.sql` — Database schema
- `docs/seed-data.sql` — Development seed data
- `docs/api-routes.md` — API endpoint specifications
