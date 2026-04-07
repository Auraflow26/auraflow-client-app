import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { PulseView } from './PulseView'
import { greeting } from '@/lib/utils'
import type { AgentActivity, ClientProfile, DailyMetrics } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single<ClientProfile>()
  if (!profile) return null

  const today = new Date().toISOString().split('T')[0]

  const [{ data: metricsToday }, { data: recentMetrics }, { data: activity }] = await Promise.all([
    supabase
      .from('daily_metrics')
      .select('*')
      .eq('client_id', profile.client_id)
      .eq('date', today)
      .maybeSingle<DailyMetrics>(),
    supabase
      .from('daily_metrics')
      .select('*')
      .eq('client_id', profile.client_id)
      .order('date', { ascending: false })
      .limit(8)
      .returns<DailyMetrics[]>(),
    supabase
      .from('agent_activity')
      .select('*')
      .eq('client_id', profile.client_id)
      .order('created_at', { ascending: false })
      .limit(10)
      .returns<AgentActivity[]>(),
  ])

  // latest = today, prev = yesterday (for trends)
  const latest = metricsToday ?? recentMetrics?.[0] ?? null
  const prev = recentMetrics?.[1] ?? null
  const first = profile.contact_name.split(' ')[0]

  return (
    <>
      <DashboardHeader title={greeting(first)} subtitle={profile.business_name} />
      <DashboardShell>
        <PulseView metrics={latest} prevMetrics={prev} activity={activity ?? []} />
      </DashboardShell>
    </>
  )
}
