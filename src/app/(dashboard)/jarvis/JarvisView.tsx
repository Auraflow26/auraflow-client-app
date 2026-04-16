'use client'

import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Activity, AlertCircle, CheckCircle2, Clock, Cpu, ServerCog, Wifi, WifiOff } from 'lucide-react'
import {
  type JarvisTask,
  type JarvisDaemonHeartbeat,
  STATUS_LABEL,
  STATUS_COLOR,
  KIND_ICON,
} from '@/lib/jarvis/types'
import { VoiceWidget } from './VoiceWidget'

interface Props {
  initialTasks: JarvisTask[]
  initialDaemons: JarvisDaemonHeartbeat[]
}

export function JarvisView({ initialTasks, initialDaemons }: Props) {
  const [tasks, setTasks] = useState<JarvisTask[]>(initialTasks)
  const [daemons, setDaemons] = useState<JarvisDaemonHeartbeat[]>(initialDaemons)
  const [filter, setFilter] = useState<'all' | 'awaiting_approval' | 'active'>('all')
  const [pendingApprovalIds, setPendingApprovalIds] = useState<Set<string>>(new Set())

  // Realtime subscription
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const taskChannel = supabase
      .channel('jarvis_tasks_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jarvis_tasks' },
        (payload) => {
          setTasks((prev) => {
            if (payload.eventType === 'INSERT') return [payload.new as JarvisTask, ...prev].slice(0, 100)
            if (payload.eventType === 'UPDATE') {
              return prev.map((t) => (t.id === (payload.new as JarvisTask).id ? (payload.new as JarvisTask) : t))
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter((t) => t.id !== (payload.old as JarvisTask).id)
            }
            return prev
          })
        },
      )
      .subscribe()

    const daemonChannel = supabase
      .channel('jarvis_daemons_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jarvis_daemon_heartbeat' },
        (payload) => {
          setDaemons((prev) => {
            const incoming = payload.new as JarvisDaemonHeartbeat
            const filtered = prev.filter((d) => d.daemon_id !== incoming.daemon_id)
            return [incoming, ...filtered]
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(taskChannel)
      supabase.removeChannel(daemonChannel)
    }
  }, [])

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks
    if (filter === 'awaiting_approval') return tasks.filter((t) => t.status === 'awaiting_approval')
    return tasks.filter((t) => ['pending', 'running', 'approved'].includes(t.status))
  }, [tasks, filter])

  const awaitingCount = tasks.filter((t) => t.status === 'awaiting_approval').length

  async function decide(taskId: string, decision: 'approve' | 'reject', reason?: string) {
    setPendingApprovalIds((s) => new Set(s).add(taskId))
    try {
      const res = await fetch('/api/jarvis/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, decision, reason }),
      })
      if (!res.ok) {
        const text = await res.text()
        alert(`Decision failed: ${text}`)
      }
    } finally {
      setPendingApprovalIds((s) => {
        const next = new Set(s)
        next.delete(taskId)
        return next
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Top row — metrics + voice */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MetricTile
          icon={<AlertCircle className="w-5 h-5" />}
          label="Awaiting your approval"
          value={awaitingCount}
          accent={awaitingCount > 0 ? 'text-amber-400' : 'text-zinc-500'}
        />
        <MetricTile
          icon={<Activity className="w-5 h-5" />}
          label="Active tasks"
          value={tasks.filter((t) => ['pending', 'running', 'approved'].includes(t.status)).length}
          accent="text-blue-400"
        />
        <MetricTile
          icon={<Cpu className="w-5 h-5" />}
          label="Daemons online"
          value={daemons.filter((d) => isLive(d.last_seen)).length}
          suffix={`/ ${daemons.length || 1}`}
          accent="text-emerald-400"
        />
      </div>

      {/* Voice widget — full width */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
          <ServerCog className="w-4 h-4" /> Voice — talk to Jarvis
        </h3>
        <VoiceWidget />
      </section>

      {/* Daemons */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Daemons</h3>
        {daemons.length === 0 ? (
          <p className="text-sm text-zinc-500">No daemons have checked in yet. Start <code className="text-zinc-400">cd daemon &amp;&amp; npm run dev</code> on your MacBook.</p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {daemons.map((d) => (
              <li key={d.daemon_id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  {isLive(d.last_seen) ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-zinc-600" />}
                  <div>
                    <div className="text-sm text-zinc-200">{d.daemon_id}</div>
                    <div className="text-xs text-zinc-500">{d.run_user}@{d.platform} · v{d.version}</div>
                  </div>
                </div>
                <span className="text-xs text-zinc-500">{ago(d.last_seen)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Tasks */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-zinc-300">Tasks</h3>
          <div className="flex gap-2 text-xs">
            {(['all', 'awaiting_approval', 'active'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full ${filter === f ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {f === 'awaiting_approval' ? 'Approval' : f === 'active' ? 'Active' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <p className="text-sm text-zinc-500">No tasks.</p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {filteredTasks.map((t) => (
              <li key={t.id} className="py-3">
                <div className="flex items-start gap-3">
                  <span className="text-lg leading-none mt-0.5">{KIND_ICON[t.kind]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[t.status]}`}>
                        {STATUS_LABEL[t.status]}
                      </span>
                      <span className="text-xs text-zinc-500">from {t.created_by}</span>
                      <span className="text-xs text-zinc-600">·</span>
                      <span className="text-xs text-zinc-500">{ago(t.created_at)}</span>
                    </div>
                    <pre className="mt-1 text-xs font-mono text-zinc-400 whitespace-pre-wrap break-all line-clamp-3">
                      {t.payload.cmd ?? t.payload.path ?? JSON.stringify(t.payload).slice(0, 200)}
                    </pre>
                    {t.result && (
                      <pre className="mt-1 text-xs font-mono text-zinc-500 whitespace-pre-wrap break-all line-clamp-2">
                        {(t.result.stdout_last || t.result.stderr_last).slice(0, 240)}
                      </pre>
                    )}

                    {t.status === 'awaiting_approval' && (
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => decide(t.id, 'approve')}
                          disabled={pendingApprovalIds.has(t.id)}
                          className="px-3 py-1 text-xs rounded-md bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const reason = prompt('Reject reason (optional):') ?? undefined
                            decide(t.id, 'reject', reason)
                          }}
                          disabled={pendingApprovalIds.has(t.id)}
                          className="px-3 py-1 text-xs rounded-md bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function MetricTile({ icon, label, value, suffix, accent }: { icon: React.ReactNode; label: string; value: number; suffix?: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <div className="flex items-center justify-between text-zinc-400">
        <span className="text-xs uppercase tracking-wider">{label}</span>
        <span className={accent}>{icon}</span>
      </div>
      <div className={`mt-2 text-3xl font-semibold ${accent}`}>
        {value}{suffix && <span className="text-base text-zinc-500">{suffix}</span>}
      </div>
    </div>
  )
}

function isLive(ts: string): boolean {
  return Date.now() - new Date(ts).getTime() < 90_000
}

function ago(ts: string): string {
  const sec = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (sec < 60) return `${sec}s ago`
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`
  return `${Math.floor(sec / 86400)}d ago`
}
