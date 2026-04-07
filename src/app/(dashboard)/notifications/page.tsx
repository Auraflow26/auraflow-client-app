import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { NotificationsView } from './NotificationsView'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { ClientProfile, Notification } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('client_profiles')
    .select('client_id')
    .eq('user_id', user.id)
    .single<Pick<ClientProfile, 'client_id'>>()
  if (!profile) return null

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('client_id', profile.client_id)
    .order('created_at', { ascending: false })
    .limit(100)
    .returns<Notification[]>()

  return (
    <>
      <header className="glass sticky top-0 z-30 border-b border-border">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary hover:border-border-active"
          >
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-lg font-semibold text-text-primary">Notifications</h1>
        </div>
      </header>
      <DashboardShell>
        <NotificationsView
          notifications={notifications ?? []}
          clientId={profile.client_id}
        />
      </DashboardShell>
    </>
  )
}
