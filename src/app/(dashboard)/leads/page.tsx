import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { LeadsView } from './LeadsView'
import type { Lead, ClientProfile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single<ClientProfile>()
  if (!profile) return null

  const { data: leads } = await supabase
    .from('lead_interactions')
    .select('*')
    .eq('client_id', profile.client_id)
    .order('created_at', { ascending: false })
    .limit(100)
    .returns<Lead[]>()

  return (
    <>
      <DashboardHeader title="Leads" subtitle={`${leads?.length ?? 0} total`} />
      <DashboardShell>
        <LeadsView leads={leads ?? []} />
      </DashboardShell>
    </>
  )
}
