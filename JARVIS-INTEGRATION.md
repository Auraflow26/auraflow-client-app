# Jarvis Integration

This Next.js client app is the executive control surface for [Javaris](https://github.com/Auraflow26/javaris) — the AuraFlow agent orchestrator.

## What was added (2026-04-16)

| File | Purpose |
|------|---------|
| `src/lib/jarvis/types.ts` | Mirror of the Supabase schema in javaris/supabase/schema.sql |
| `src/app/(dashboard)/jarvis/page.tsx` | Server component, gated to admin emails |
| `src/app/(dashboard)/jarvis/JarvisView.tsx` | Client component — Realtime task feed + approval UI + daemon status |
| `src/app/(dashboard)/jarvis/VoiceWidget.tsx` | ElevenLabs Conversational AI agent embed (Cyrus AF) |
| `src/app/api/jarvis/approve/route.ts` | POST endpoint to approve/reject a task — writes audit row |

## Required env vars

Add these to `.env.local`:

```
# Limits who can see /jarvis (comma-separated)
JARVIS_ADMIN_EMAILS=mo@auraflowusa.com

# ElevenLabs agent ID for the voice widget (defaults to Cyrus AF)
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_1001knww7wwafyqtrnbk1q6ev143
```

The Supabase env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are already set up — the Jarvis route reuses them.

## Required Supabase tables

Apply [javaris/supabase/schema.sql](https://github.com/Auraflow26/javaris/blob/main/supabase/schema.sql) to the **same** Supabase project this app uses. The four tables (`jarvis_tasks`, `jarvis_task_logs`, `jarvis_daemon_heartbeat`, `jarvis_approvals`) live alongside your existing client data — they're namespaced with `jarvis_*` prefix and have RLS enabled so customer accounts can't see them.

## How it works

1. **Daemon** on Mo's MacBook (in the `javaris/daemon/` directory) polls the `jarvis_tasks` table
2. **Mac Mini agents** (or anything else) insert tasks: `{kind: 'exec', payload: {cmd: 'git status'}}`
3. The daemon classifies via `policy.ts` — safe ops run immediately; risky ops (`sudo`, `rm -rf`, prod writes) flip status to `awaiting_approval`
4. **This `/jarvis` admin page** subscribes to Realtime — awaiting tasks pop into the approval queue
5. Mo taps Approve on his phone → status flips to `approved` → daemon picks it up and runs

## Voice widget

The embedded ElevenLabs widget connects to your existing "Cyrus AF" agent. Tools the agent can call (status, dispatch, etc.) are configured in the [ElevenLabs dashboard](https://elevenlabs.io/app/conversational-ai/agents) — they POST to webhooks you can host on this app under `/api/jarvis/tools/*` (next iteration).

## Not yet built

- `/api/jarvis/tools/*` endpoints for ElevenLabs to call
- Push notification when an approval lands
- Per-task drill-down page with full streaming logs
- Multi-tenant scoping (today's RLS is "admin sees everything")
