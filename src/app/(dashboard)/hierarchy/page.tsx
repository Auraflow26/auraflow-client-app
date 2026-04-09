import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { scoreColor } from '@/lib/utils'
import type { ClientProfile, HierarchyNode } from '@/lib/types'

export const dynamic = 'force-dynamic'

const LAYER_COLORS: Record<string, string> = {
  core_c1: '#8b5cf6',
  core_c2: '#a78bfa',
  core_c3: '#c4b5fd',
  ext_e1: '#10b981',
  ext_e2: '#34d399',
  ext_e3: '#6ee7b7',
  ext_e4: '#3b82f6',
  ext_e5: '#60a5fa',
  ext_e6: '#f59e0b',
  ext_e7: '#fbbf24',
}

const LAYER_LABELS: Record<string, string> = {
  core_c1: 'C1 · Core Operations',
  core_c2: 'C2 · Management',
  core_c3: 'C3 · Strategy',
  ext_e1: 'E1 · Lead Generation',
  ext_e2: 'E2 · Conversion',
  ext_e3: 'E3 · Fulfillment',
  ext_e4: 'E4 · Retention',
  ext_e5: 'E5 · Reporting',
  ext_e6: 'E6 · Finance',
  ext_e7: 'E7 · Compliance',
}

export default async function HierarchyPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single<ClientProfile>()
  if (!profile) redirect('/login')

  const { data: nodes } = await supabase
    .from('hierarchy_nodes')
    .select('*')
    .eq('client_id', profile.client_id)
    .order('layer_position', { ascending: true })
    .returns<HierarchyNode[]>()

  // Group by layer_type
  const byLayer = (nodes ?? []).reduce<Record<string, HierarchyNode[]>>((acc, n) => {
    if (!acc[n.layer_type]) acc[n.layer_type] = []
    acc[n.layer_type].push(n)
    return acc
  }, {})

  const coreLayerOrder = ['core_c1', 'core_c2', 'core_c3']
  const extLayerOrder = ['ext_e1', 'ext_e2', 'ext_e3', 'ext_e4', 'ext_e5', 'ext_e6', 'ext_e7']

  const foundationScore = profile.foundation_score ?? 0
  const complexityScore = profile.complexity_score ?? 0

  return (
    <>
      <DashboardHeader title="Business Hierarchy" subtitle={profile.business_name} />
      <DashboardShell>
        <div className="space-y-6">
          {/* Score summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-card border border-border bg-bg-card p-4">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-gold">Foundation Score</div>
              <div className="font-mono text-2xl font-semibold" style={{ color: scoreColor(foundationScore) }}>
                {foundationScore}
                <span className="text-base font-normal text-text-muted">/100</span>
              </div>
              <div className="mt-1 text-xs text-text-muted">System health</div>
            </div>
            <div className="rounded-card border border-border bg-bg-card p-4">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-gold">Complexity</div>
              <div className="font-mono text-2xl font-semibold text-accent-bright">
                {complexityScore}
                <span className="text-base font-normal text-text-muted">/40</span>
              </div>
              <div className="mt-1 text-xs text-text-muted">Setup complexity</div>
            </div>
          </div>

          {/* Hierarchy depth badge */}
          <div className="rounded-card border border-border bg-bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-gold">Hierarchy Depth</div>
                <div className="mt-1 text-sm text-text-primary">
                  {profile.hierarchy_depth ?? 3} active layers deployed
                </div>
              </div>
              <div className="font-mono text-3xl font-bold text-accent">
                {profile.hierarchy_depth ?? 3}
              </div>
            </div>
          </div>

          {/* Core Layers */}
          {coreLayerOrder.some(l => byLayer[l]?.length) && (
            <section>
              <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-gold">Core Layers</div>
              <div className="space-y-2">
                {coreLayerOrder.map(layerKey => {
                  const layerNodes = byLayer[layerKey] ?? []
                  if (layerNodes.length === 0) return null
                  const color = LAYER_COLORS[layerKey] ?? '#8b5cf6'
                  return (
                    <LayerCard
                      key={layerKey}
                      label={LAYER_LABELS[layerKey] ?? layerKey}
                      color={color}
                      nodes={layerNodes}
                    />
                  )
                })}
              </div>
            </section>
          )}

          {/* Extension Layers */}
          {extLayerOrder.some(l => byLayer[l]?.length) && (
            <section>
              <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-gold">Extension Layers</div>
              <div className="space-y-2">
                {extLayerOrder.map(layerKey => {
                  const layerNodes = byLayer[layerKey] ?? []
                  if (layerNodes.length === 0) return null
                  const color = LAYER_COLORS[layerKey] ?? '#10b981'
                  return (
                    <LayerCard
                      key={layerKey}
                      label={LAYER_LABELS[layerKey] ?? layerKey}
                      color={color}
                      nodes={layerNodes}
                    />
                  )
                })}
              </div>
            </section>
          )}

          {/* Empty state */}
          {Object.keys(byLayer).length === 0 && (
            <div className="rounded-card border border-border bg-bg-card p-8 text-center">
              <div className="mb-2 text-text-muted">Hierarchy map is being built</div>
              <div className="text-xs text-text-dim">
                Your AuraFlow advisor is configuring your business layers.
                This view will populate after your initial setup is complete.
              </div>
            </div>
          )}
        </div>
      </DashboardShell>
    </>
  )
}

function LayerCard({
  label,
  color,
  nodes,
}: {
  label: string
  color: string
  nodes: HierarchyNode[]
}) {
  const active = nodes.filter(n => n.is_active)
  return (
    <div className="rounded-card border border-border bg-bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="font-mono text-[11px] uppercase tracking-wide text-text-secondary">{label}</span>
        <span className="ml-auto font-mono text-[10px] text-text-muted">
          {active.length}/{nodes.length} active
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {nodes.map(n => (
          <span
            key={n.id}
            className={`rounded-pill px-2.5 py-1 font-mono text-[11px] ${
              n.is_active
                ? 'border border-border-active text-text-primary'
                : 'border border-border text-text-dim'
            }`}
            style={n.is_active ? { borderColor: `${color}60`, color } : {}}
          >
            {n.node_name}
          </span>
        ))}
      </div>
    </div>
  )
}
