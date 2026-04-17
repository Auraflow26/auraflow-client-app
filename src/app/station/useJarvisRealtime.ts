'use client'

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export interface AgentState {
  name: string
  status: 'idle' | 'executing' | 'blocked' | 'complete'
  currentTask: string
}

export interface TaskSummary {
  id: string
  created_by: string
  kind: string
  status: string
  cmd?: string
  created_at: string
}

export interface DaemonState {
  daemon_id: string
  last_seen: string
  alive: boolean
}

export interface StationStats {
  daemonsLive: number
  activeTasks: number
  awaitingApproval: number
  completedToday: number
}

const AGENT_NAMES = ['orion', 'cyrus', 'nova', 'maven', 'atlas']

export function useJarvisRealtime() {
  const [tasks, setTasks] = useState<TaskSummary[]>([])
  const [daemons, setDaemons] = useState<DaemonState[]>([])
  const [agents, setAgents] = useState<AgentState[]>(
    AGENT_NAMES.map((n) => ({ name: n, status: 'idle', currentTask: '' })),
  )
  const [stats, setStats] = useState<StationStats>({
    daemonsLive: 0, activeTasks: 0, awaitingApproval: 0, completedToday: 0,
  })

  const computeStats = useCallback((taskList: TaskSummary[], daemonList: DaemonState[]) => {
    const now = Date.now()
    const oneDayAgo = now - 86_400_000
    setStats({
      daemonsLive: daemonList.filter((d) => d.alive).length,
      activeTasks: taskList.filter((t) => ['pending', 'running', 'approved'].includes(t.status)).length,
      awaitingApproval: taskList.filter((t) => t.status === 'awaiting_approval').length,
      completedToday: taskList.filter((t) => t.status === 'done' && new Date(t.created_at).getTime() > oneDayAgo).length,
    })
  }, [])

  const deriveAgents = useCallback((taskList: TaskSummary[]) => {
    setAgents(AGENT_NAMES.map((name) => {
      const agentTasks = taskList.filter((t) => t.created_by.toLowerCase().includes(name))
      const running = agentTasks.find((t) => t.status === 'running')
      const blocked = agentTasks.find((t) => t.status === 'awaiting_approval')
      return {
        name,
        status: running ? 'executing' : blocked ? 'blocked' : 'idle',
        currentTask: (running?.cmd ?? blocked?.cmd ?? '').slice(0, 80),
      }
    }))
  }, [])

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return

    const supabase = createBrowserClient(url, key)

    // Initial fetch
    async function load() {
      const [{ data: t }, { data: d }] = await Promise.all([
        supabase.from('jarvis_tasks').select('id,created_by,kind,status,payload,created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('jarvis_daemon_heartbeat').select('*'),
      ])

      const taskList: TaskSummary[] = (t ?? []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        created_by: row.created_by as string,
        kind: row.kind as string,
        status: row.status as string,
        cmd: (row.payload as Record<string, unknown>)?.cmd as string | undefined,
        created_at: row.created_at as string,
      }))

      const daemonList: DaemonState[] = (d ?? []).map((row: Record<string, unknown>) => ({
        daemon_id: row.daemon_id as string,
        last_seen: row.last_seen as string,
        alive: Date.now() - new Date(row.last_seen as string).getTime() < 90_000,
      }))

      setTasks(taskList)
      setDaemons(daemonList)
      computeStats(taskList, daemonList)
      deriveAgents(taskList)
    }

    load()

    // Realtime subscriptions
    const taskCh = supabase.channel('station-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jarvis_tasks' }, () => { load() })
      .subscribe()

    const daemonCh = supabase.channel('station-daemons')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jarvis_daemon_heartbeat' }, () => { load() })
      .subscribe()

    // Refresh daemon liveness every 30s
    const interval = setInterval(load, 30_000)

    return () => {
      supabase.removeChannel(taskCh)
      supabase.removeChannel(daemonCh)
      clearInterval(interval)
    }
  }, [computeStats, deriveAgents])

  return { agents, tasks, daemons, stats }
}
