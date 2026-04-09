import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { ContentView } from './ContentView'
import type { ClientProfile, AgentActivity } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ContentPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single<ClientProfile>()
  if (!profile) redirect('/login')

  // Pull content request history from agent_activity
  const { data: history } = await supabase
    .from('agent_activity')
    .select('*')
    .eq('client_id', profile.client_id)
    .eq('category', 'workflow')
    .ilike('action', '%content%')
    .order('created_at', { ascending: false })
    .limit(20)
    .returns<AgentActivity[]>()

  return (
    <>
      <DashboardHeader title="Content Engine" subtitle="Request AI-produced content" />
      <DashboardShell>
        <ContentView history={history ?? []} />
      </DashboardShell>
    </>
  )
}
