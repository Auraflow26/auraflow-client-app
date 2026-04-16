// Jarvis tools — what Cyrus AF (the ElevenLabs agent) can ASK the system to do.
// Each tool either:
//   (a) creates a row in jarvis_tasks for the daemon to execute, or
//   (b) reads existing state from Supabase
//
// Tool execution is async — voice replies "queued" immediately, the daemon runs it,
// results stream back to /jarvis. Voice doesn't block waiting for shell output.

import { createClient } from '@supabase/supabase-js'
import type { TaskKind } from './types'

const supa = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

// ── Tool catalog (Anthropic native format) ──────────────────────────────

export const JARVIS_TOOLS = [
  {
    name: 'get_status',
    description: 'Get the current Jarvis system status — how many daemons are alive, how many tasks are pending or awaiting approval, how many recent agent outputs exist. Use this when Mo asks "how is everything", "what is going on", "status", or "are you up".',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'queue_command',
    description: 'Queue an arbitrary shell command to be executed on Mo\'s MacBook. Use sparingly — only when Mo asks you to run a specific command. Risky commands (sudo, rm -rf, network installs) will require Mo to approve in the /jarvis admin page before they run.',
    input_schema: {
      type: 'object' as const,
      properties: {
        cmd: { type: 'string', description: 'The shell command to run, e.g. "git status" or "ls ~/Desktop"' },
        cwd: { type: 'string', description: 'Optional working directory; defaults to ~/' },
        reason: { type: 'string', description: 'One-sentence reason — shown in the approval queue if approval is needed' },
      },
      required: ['cmd', 'reason'],
    },
  },
  {
    name: 'dispatch_agents',
    description: 'Dispatch the current tasks/<agent>.md files to the Mac Mini agents (Orion, Cyrus, Nova, Maven, Atlas). Use when Mo says "send out the tasks", "dispatch", or "kick off the cycle".',
    input_schema: {
      type: 'object' as const,
      properties: {
        agents: {
          type: 'array',
          items: { type: 'string', enum: ['orion', 'cyrus', 'nova', 'maven', 'atlas'] },
          description: 'Specific agents to dispatch to. Omit to dispatch all.',
        },
      },
      required: [],
    },
  },
  {
    name: 'collect_outputs',
    description: 'Pull the latest OUTPUT.md from each agent on the Mac Mini back to the local repo. Use after agents have had time to work, or when Mo asks "pull results", "collect", "what did they ship".',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'run_morning_brief',
    description: 'Trigger the morning brief script that summarizes overnight agent activity. Speaks the result via ElevenLabs.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'list_pending_approvals',
    description: 'List tasks currently waiting for Mo\'s approval — the ones that triggered the policy gate (sudo, risky writes, etc.).',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'send_notification',
    description: 'Push a macOS desktop notification on Mo\'s MacBook. Use for reminders or to surface something time-sensitive when he is not at the terminal.',
    input_schema: {
      type: 'object' as const,
      properties: {
        message: { type: 'string', description: 'The notification body. Keep under 140 characters.' },
      },
      required: ['message'],
    },
  },
]

// ── Tool executors ──────────────────────────────────────────────────────

export type ToolName = (typeof JARVIS_TOOLS)[number]['name']

export interface ToolResult {
  ok: boolean
  summary: string
  detail?: unknown
}

export async function runTool(name: string, input: Record<string, unknown>): Promise<ToolResult> {
  switch (name) {
    case 'get_status':           return getStatus()
    case 'queue_command':        return queueCommand(input as { cmd: string; cwd?: string; reason: string })
    case 'dispatch_agents':      return dispatchAgents(input as { agents?: string[] })
    case 'collect_outputs':      return queueExec('cd /Users/motalebi/cortex-os/agents/javaris && ./collect_outputs.sh', 'collect outputs from Mac Mini')
    case 'run_morning_brief':    return queueExec('cd /Users/motalebi/cortex-os/agents/javaris && ./scripts/morning_brief.sh --silent', 'morning brief')
    case 'list_pending_approvals': return listPendingApprovals()
    case 'send_notification':    return sendNotification(input as { message: string })
    default:                     return { ok: false, summary: `unknown tool: ${name}` }
  }
}

// ── Implementations ─────────────────────────────────────────────────────

async function getStatus(): Promise<ToolResult> {
  const s = supa()
  const ninetySecAgo = new Date(Date.now() - 90_000).toISOString()
  const oneDayAgo = new Date(Date.now() - 86_400_000).toISOString()

  const [{ count: liveDaemons }, { count: pending }, { count: awaiting }, { count: doneToday }] = await Promise.all([
    s.from('jarvis_daemon_heartbeat').select('*', { count: 'exact', head: true }).gte('last_seen', ninetySecAgo),
    s.from('jarvis_tasks').select('*', { count: 'exact', head: true }).in('status', ['pending', 'running', 'approved']),
    s.from('jarvis_tasks').select('*', { count: 'exact', head: true }).eq('status', 'awaiting_approval'),
    s.from('jarvis_tasks').select('*', { count: 'exact', head: true }).eq('status', 'done').gte('updated_at', oneDayAgo),
  ])

  return {
    ok: true,
    summary: `${liveDaemons ?? 0} daemons live, ${pending ?? 0} tasks active, ${awaiting ?? 0} awaiting your approval, ${doneToday ?? 0} completed in the last 24 hours.`,
    detail: { liveDaemons, pending, awaiting, doneToday },
  }
}

async function queueCommand(input: { cmd: string; cwd?: string; reason: string }): Promise<ToolResult> {
  return queueTask('exec', { cmd: input.cmd, cwd: input.cwd ?? '~/' }, `voice: ${input.reason}`)
}

async function dispatchAgents(input: { agents?: string[] }): Promise<ToolResult> {
  const list = (input.agents ?? []).join(' ')
  const cmd = `cd /Users/motalebi/cortex-os/agents/javaris && ./dispatch_tasks.sh ${list}`.trim()
  return queueExec(cmd, input.agents?.length ? `dispatch to ${input.agents.join(', ')}` : 'dispatch to all agents')
}

async function queueExec(cmd: string, reason: string): Promise<ToolResult> {
  return queueTask('exec', { cmd, cwd: '/Users/motalebi/cortex-os/agents/javaris' }, `voice: ${reason}`)
}

async function queueTask(kind: TaskKind, payload: Record<string, unknown>, label: string): Promise<ToolResult> {
  const s = supa()
  const { data, error } = await s.from('jarvis_tasks').insert({
    created_by: 'cyrus-voice',
    kind,
    payload,
  }).select('id, status').single()

  if (error) return { ok: false, summary: `Could not queue: ${error.message}` }

  return {
    ok: true,
    summary: data.status === 'awaiting_approval'
      ? `I have queued "${label}" but it needs your approval. Tap approve in the Jarvis page.`
      : `Queued "${label}". I will let you know when it is done.`,
    detail: { task_id: data.id, status: data.status },
  }
}

async function listPendingApprovals(): Promise<ToolResult> {
  const s = supa()
  const { data, error } = await s
    .from('jarvis_tasks')
    .select('id, created_at, payload')
    .eq('status', 'awaiting_approval')
    .order('created_at', { ascending: true })
    .limit(5)

  if (error) return { ok: false, summary: `Could not check: ${error.message}` }
  if (!data || data.length === 0) return { ok: true, summary: 'No tasks waiting on you. All clear.' }

  const lines = data.map((t, i) => {
    const cmd = (t.payload as { cmd?: string }).cmd ?? '(unknown)'
    return `${i + 1}: ${cmd.slice(0, 80)}`
  }).join('. ')

  return {
    ok: true,
    summary: `${data.length} waiting for approval. ${lines}.`,
    detail: data,
  }
}

async function sendNotification(input: { message: string }): Promise<ToolResult> {
  return queueTask('notify', { content: input.message }, `notify: ${input.message.slice(0, 30)}`)
}
