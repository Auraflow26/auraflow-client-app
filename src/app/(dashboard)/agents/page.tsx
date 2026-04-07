import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { AgentStatusCard } from '@/components/ui/AgentStatusCard'
import { ActivityItem } from '@/components/ui/ActivityItem'
import { AGENTS, type AgentActivity, type ClientProfile, type AgentName } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AgentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single<ClientProfile>()
  if (!profile) return null

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

  return (
    <>
      <DashboardHeader title="Agents" subtitle="6 autonomous intelligences" />
      <DashboardShell>
        <div className="space-y-4">
          <div className="grid gap-3">
            {AGENTS.map((a) => {
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

              return (
                <AgentStatusCard
                  key={a.name}
                  config={a}
                  status={status}
                  metric={count > 0 ? `${count} actions in last 24h` : 'No activity yet today'}
                  lastHeartbeat={last?.created_at ?? null}
                />
              )
            })}
          </div>

          <section>
            <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-gold">
              Recent activity
            </div>
            <div className="rounded-card border border-border bg-bg-card px-4">
              {(recent ?? []).slice(0, 15).map((a) => (
                <ActivityItem key={a.id} item={a} />
              ))}
              {(!recent || recent.length === 0) && (
                <div className="py-6 text-center text-sm text-text-muted">No activity yet.</div>
              )}
            </div>
          </section>
        </div>
      </DashboardShell>
    </>
  )
}
