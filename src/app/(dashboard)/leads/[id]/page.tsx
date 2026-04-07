import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Phone, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Badge } from '@/components/ui/Badge'
import {
  formatCurrency,
  formatDate,
  leadScoreBadge,
  timeAgo,
} from '@/lib/utils'
import { LEAD_SOURCES, type Lead, type ClientProfile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single<ClientProfile>()
  if (!profile) return null

  const { data: lead } = await supabase
    .from('lead_interactions')
    .select('*')
    .eq('id', params.id)
    .eq('client_id', profile.client_id)
    .single<Lead>()

  if (!lead) notFound()

  const source = LEAD_SOURCES[lead.source]
  const score = leadScoreBadge(lead.lead_score)

  return (
    <>
      <header className="glass sticky top-0 z-30 border-b border-border">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <Link
            href="/leads"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary hover:border-border-active"
          >
            <ArrowLeft size={16} />
          </Link>
          <h1 className="truncate text-lg font-semibold text-text-primary">{lead.lead_name}</h1>
        </div>
      </header>

      <DashboardShell>
        <div className="space-y-5">
          <section className="rounded-card border border-border bg-bg-card p-5">
            <div className="flex items-center gap-2">
              <Badge color={score.color} bg={score.bg}>{score.label} · {lead.lead_score}</Badge>
              <Badge color={source.color} bg={`${source.color}20`}>{source.label}</Badge>
              <Badge>{lead.status}</Badge>
            </div>
            <div className="mt-4 font-mono text-3xl font-semibold text-text-primary">
              {formatCurrency(lead.estimated_value)}
            </div>
            <div className="text-sm text-text-muted">{lead.service_type}</div>
            {lead.lead_location && (
              <div className="mt-1 text-xs text-text-muted">{lead.lead_location}</div>
            )}
          </section>

          <section className="space-y-2">
            {lead.lead_phone && (
              <a
                href={`tel:${lead.lead_phone}`}
                className="flex items-center gap-3 rounded-card border border-border bg-bg-card p-4 transition-colors hover:border-border-active"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-glow text-accent-bright">
                  <Phone size={16} />
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-gold">Phone</div>
                  <div className="text-sm text-text-primary">{lead.lead_phone}</div>
                </div>
              </a>
            )}
            {lead.lead_email && (
              <a
                href={`mailto:${lead.lead_email}`}
                className="flex items-center gap-3 rounded-card border border-border bg-bg-card p-4 transition-colors hover:border-border-active"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-glow text-accent-bright">
                  <Mail size={16} />
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-gold">Email</div>
                  <div className="text-sm text-text-primary">{lead.lead_email}</div>
                </div>
              </a>
            )}
          </section>

          <section>
            <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-gold">Timeline</div>
            <div className="rounded-card border border-border bg-bg-card p-4">
              <div className="space-y-3">
                <TimelineRow
                  label="Captured"
                  time={lead.created_at}
                  detail={`via ${source.label}`}
                />
                {lead.qualified_at && (
                  <TimelineRow label="Qualified" time={lead.qualified_at} />
                )}
                {lead.booked_at && <TimelineRow label="Booked" time={lead.booked_at} />}
                {lead.won_at && <TimelineRow label="Won" time={lead.won_at} />}
                {lead.lost_at && (
                  <TimelineRow
                    label="Lost"
                    time={lead.lost_at}
                    detail={lead.lost_reason ?? undefined}
                  />
                )}
                {lead.follow_up_history?.map((f, i) => (
                  <TimelineRow
                    key={i}
                    label={`Follow-up #${f.stage} · ${f.channel}`}
                    time={f.sent_at}
                    detail={f.content}
                  />
                ))}
              </div>
            </div>
          </section>

          {lead.notes && (
            <section>
              <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-gold">Notes</div>
              <div className="rounded-card border border-border bg-bg-card p-4 text-sm text-text-secondary">
                {lead.notes}
              </div>
            </section>
          )}
        </div>
      </DashboardShell>
    </>
  )
}

function TimelineRow({ label, time, detail }: { label: string; time: string; detail?: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-text-primary">{label}</span>
          <span className="font-mono text-[10px] text-text-muted" title={formatDate(time, 'PPpp')}>
            {timeAgo(time)}
          </span>
        </div>
        {detail && <div className="mt-0.5 text-xs text-text-muted">{detail}</div>}
      </div>
    </div>
  )
}
