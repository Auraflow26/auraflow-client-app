import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/ui/BottomNav'
import { AppProvider } from '@/components/layout/AppProvider'
import type { ClientProfile } from '@/lib/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="mb-2 text-xl font-semibold text-text-primary">No profile yet</h1>
        <p className="text-sm text-text-muted">
          Your AuraFlow client profile hasn&apos;t been set up. Contact your advisor to complete onboarding.
        </p>
      </main>
    )
  }

  return (
    <AppProvider profile={profile as ClientProfile}>
      <div className="radial-glow min-h-screen">
        {children}
        <BottomNav />
      </div>
    </AppProvider>
  )
}
