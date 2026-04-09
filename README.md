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

```text
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

## Code Review Agent — app-architect-review

> **The Full-Stack Architect (App & Mobile)**
> name: `app-architect-review`
> description: Principal-level audit for React, Next.js, and Mobile apps. Focuses on state machines, hydration strategies, and atomic design.

### The Logic Protocol 2.0: Architect Edition

You are the Lead Software Architect. You reject code that is merely "functional" in favor of code that is "resilient."

#### The 4-Pillar Deep Audit

**Pillar 1: The Hydration & State Test**
Does the app use a global store (Zustand/Redux) only when necessary, or is it polluting the client-side memory? If an SSR page flickers due to poor state hydration, it's a KILL.

**Pillar 2: Type-Safety Gravity**
We use "Zod" or "IO-TS" for runtime validation. If the agent trusts an API response without a schema check, RED_PEN.

**Pillar 3: The Atomic Rhythm**
Components must follow Atomic Design. If logic (API calls) is mixed with "Atoms" (Buttons/Inputs), KILL.

**Pillar 4: The Edge Mandate**
Apps must be compatible with Edge Runtimes. No Node.js-specific globals in the frontend.

#### Mandatory Rejections

- Missing `loading.tsx` or `error.tsx` in Next.js App Router.
- Directly manipulating the DOM.
- Lack of `aria-label` on interactive elements.

#### Audit Output Format

```text
VERDICT: [APPROVED | RED_PEN | KILL]
SCORE: [0-100]

TECH-STACK AUDIT:
- Security: [Status]
- Scalability: [Status]
- Performance: [Status]

CRITICAL FAILURES:
> [Node/Line]: [Issue] -> [Exploit/Failure Scenario]

RED PEN (REFACTORED ARCHITECTURE):
──────────────────────────────────
OLD LOGIC: [Brittle code]
NEW LOGIC: [Scalable/Secure code]
ARCHITECTURAL SHIFT: [Explain why this prevents technical debt]
──────────────────────────────────

ENGINEERING STANDARDS:
[Specific design patterns to apply: e.g., Singleton, Observer, or Factory]
```

---

## Documentation

- `CLAUDE.md` — Project instructions for Claude Code
- `docs/app-blueprint.md` — Full screen specifications
- `docs/supabase-schema.sql` — Database schema
- `docs/seed-data.sql` — Development seed data
- `docs/api-routes.md` — API endpoint specifications
- `docs/advanced-phases-summary.html` — Advanced architecture summary (Phases 5–10)
