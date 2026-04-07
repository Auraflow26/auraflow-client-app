import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { LogoutButton } from './LogoutButton'
import type { ClientProfile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single<ClientProfile>()
  if (!profile) return null

  return (
    <>
      <DashboardHeader title="Settings" subtitle={profile.business_name} />
      <DashboardShell>
        <div className="space-y-5">
          <Section title="Profile">
            <Row label="Business" value={profile.business_name} />
            <Row label="Contact" value={profile.contact_name} />
            <Row label="Email" value={profile.contact_email} />
            {profile.industry && <Row label="Industry" value={profile.industry} />}
            {profile.employee_count && <Row label="Team size" value={profile.employee_count} />}
          </Section>

          {(profile.advisor_name || profile.advisor_email) && (
            <Section title="Your advisor">
              {profile.advisor_name && <Row label="Name" value={profile.advisor_name} />}
              {profile.advisor_email && <Row label="Email" value={profile.advisor_email} />}
            </Section>
          )}

          <Section title="Help">
            <a
              href="https://auraflowusa.com/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 text-sm text-accent-bright hover:text-accent-light"
            >
              Contact support →
            </a>
          </Section>

          <LogoutButton />
        </div>
      </DashboardShell>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-gold">{title}</div>
      <div className="divide-y divide-border rounded-card border border-border bg-bg-card">
        {children}
      </div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="font-mono text-sm text-text-primary">{value}</span>
    </div>
  )
}
