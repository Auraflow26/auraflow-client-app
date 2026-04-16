import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { JarvisView } from './JarvisView'
import type { JarvisTask, JarvisDaemonHeartbeat } from '@/lib/jarvis/types'

export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = (process.env.JARVIS_ADMIN_EMAILS ?? 'mo@auraflowusa.com')
  .split(',')
  .map((s) => s.trim().toLowerCase())

export default async function JarvisAdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const email = (user.email ?? '').toLowerCase()
  if (!ADMIN_EMAILS.includes(email)) {
    redirect('/')
  }

  const [tasksRes, daemonsRes] = await Promise.all([
    supabase
      .from('jarvis_tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .returns<JarvisTask[]>(),
    supabase
      .from('jarvis_daemon_heartbeat')
      .select('*')
      .order('last_seen', { ascending: false })
      .returns<JarvisDaemonHeartbeat[]>(),
  ])

  return (
    <>
      <DashboardHeader
        title="Jarvis"
        subtitle="Live agent activity, approvals, and voice control"
      />
      <DashboardShell>
        <JarvisView
          initialTasks={tasksRes.data ?? []}
          initialDaemons={daemonsRes.data ?? []}
        />
      </DashboardShell>
    </>
  )
}
