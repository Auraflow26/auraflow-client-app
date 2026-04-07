import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { ReportsView } from './ReportsView'
import type { ClientProfile, DailyMetrics, Lead } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single<ClientProfile>()
  if (!profile) return null

  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - 90)

  const [{ data: metrics }, { data: leads }] = await Promise.all([
    supabase
      .from('daily_metrics')
      .select('*')
      .eq('client_id', profile.client_id)
      .gte('date', start.toISOString().split('T')[0])
      .order('date', { ascending: true })
      .returns<DailyMetrics[]>(),
    supabase
      .from('lead_interactions')
      .select('source')
      .eq('client_id', profile.client_id)
      .gte('created_at', start.toISOString())
      .returns<Pick<Lead, 'source'>[]>(),
  ])

  return (
    <>
      <DashboardHeader title="Reports" subtitle={profile.business_name} />
      <DashboardShell>
        <ReportsView
          profile={profile}
          metrics={metrics ?? []}
          leadSources={leads ?? []}
        />
      </DashboardShell>
    </>
  )
}
