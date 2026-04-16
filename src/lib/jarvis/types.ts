// Jarvis types — mirror of supabase/schema.sql in the javaris repo.

export type TaskKind = 'exec' | 'read' | 'write' | 'git' | 'notify'

export type TaskStatus =
  | 'pending'
  | 'running'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected'
  | 'done'
  | 'error'

export interface TaskPayload {
  cmd?: string
  path?: string
  content?: string
  cwd?: string
  env?: Record<string, string>
}

export interface TaskResult {
  exit_code: number
  stdout_last: string
  stderr_last: string
  duration_ms: number
}

export interface JarvisTask {
  id: string
  created_at: string
  updated_at: string
  created_by: string
  kind: TaskKind
  payload: TaskPayload
  requires_approval: boolean
  status: TaskStatus
  approved_by?: string | null
  result?: TaskResult | null
  daemon_id?: string | null
}

export interface JarvisTaskLog {
  id: number
  task_id: string
  ts: string
  chunk: string
}

export interface JarvisDaemonHeartbeat {
  daemon_id: string
  last_seen: string
  version?: string | null
  run_user?: string | null
  platform?: string | null
}

export interface JarvisApproval {
  id: number
  task_id: string
  decided_by: string
  decided_at: string
  decision: 'approve' | 'reject'
  reason?: string | null
}

// UI helpers
export const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: 'Queued',
  running: 'Running',
  awaiting_approval: 'Awaiting approval',
  approved: 'Approved — running',
  rejected: 'Rejected',
  done: 'Done',
  error: 'Error',
}

export const STATUS_COLOR: Record<TaskStatus, string> = {
  pending: 'bg-zinc-500/15 text-zinc-300',
  running: 'bg-blue-500/15 text-blue-300',
  awaiting_approval: 'bg-amber-500/20 text-amber-300',
  approved: 'bg-emerald-500/15 text-emerald-300',
  rejected: 'bg-rose-500/15 text-rose-300',
  done: 'bg-emerald-500/15 text-emerald-300',
  error: 'bg-rose-500/15 text-rose-300',
}

export const KIND_ICON: Record<TaskKind, string> = {
  exec: '▶',
  read: '📖',
  write: '✏️',
  git: '⎇',
  notify: '🔔',
}
