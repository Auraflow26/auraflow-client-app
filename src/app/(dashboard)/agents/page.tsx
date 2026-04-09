import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { AgentsView } from './AgentsView'
import { AGENTS, type AgentActivity, type ClientProfile, type AgentName } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AgentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single<ClientProfile>()
  if (!profile) redirect('/login')

  const since = new Date()
  since.setHours(since.getHours() - 24)

  const { data: recent } = await supabase
    .from('agent_activity')
    .select('*')
    .eq('client_id', profile.client_id)
    .order('created_at', { ascending: false })
    .limit(50)
    .returns<AgentActivity[]>()

  const lastByAgent = new Map<AgentName, AgentActivity>()
  const countToday = new Map<AgentName, number>()
  const sinceIso = since.toISOString()
  ;(recent ?? []).forEach((a) => {
    const name = a.agent_name as AgentName
    if (!lastByAgent.has(name)) lastByAgent.set(name, a)
    if (a.created_at >= sinceIso) countToday.set(name, (countToday.get(name) ?? 0) + 1)
  })

  const agentStatuses = AGENTS.map((a) => {
    const last = lastByAgent.get(a.name)
    const count = countToday.get(a.name) ?? 0
    const hoursSince = last
      ? (Date.now() - new Date(last.created_at).getTime()) / 3600000
      : Infinity
    const status: 'active' | 'idle' | 'error' = !last
      ? 'idle'
      : last.status === 'failed'
      ? 'error'
      : hoursSince < 6
      ? 'active'
      : 'idle'

    return {
      name: a.name,
      status,
      metric: count > 0 ? `${count} actions in last 24h` : 'No activity yet today',
      lastHeartbeat: last?.created_at ?? null,
    }
  })

  return (
    <>
      <DashboardHeader title="Agents" subtitle="6 autonomous intelligences" />
      <DashboardShell>
        <AgentsView activity={recent ?? []} agentStatuses={agentStatuses} />
      </DashboardShell>
    </>
  )
}
