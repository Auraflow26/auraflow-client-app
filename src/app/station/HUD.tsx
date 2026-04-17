'use client'

import type { AgentState, StationStats, TaskSummary } from './useJarvisRealtime'

interface Props {
  stats: StationStats
  selected: string | null
  agents: AgentState[]
  tasks: TaskSummary[]
  onClose: () => void
}

export function HUD({ stats, selected, agents, tasks, onClose }: Props) {
  const selectedAgent = agents.find((a) => a.name.toLowerCase() === selected?.toLowerCase())
  const agentTasks = selected
    ? tasks.filter((t) => t.created_by.toLowerCase().includes(selected.toLowerCase()))
    : []

  return (
    <>
      {/* Top-left: title */}
      <div style={{
        position: 'absolute', top: 24, left: 28,
        color: 'rgba(255,255,255,0.2)', fontSize: 11, letterSpacing: 5, textTransform: 'uppercase',
        fontFamily: '-apple-system, sans-serif', pointerEvents: 'none',
      }}>
        J.A.R.V.I.S. · Control Station
      </div>

      {/* Top-right: live metrics */}
      <div style={{
        position: 'absolute', top: 24, right: 28,
        display: 'flex', gap: 20, pointerEvents: 'none',
      }}>
        <Metric label="Daemons" value={stats.daemonsLive} color={stats.daemonsLive > 0 ? '#00ff88' : '#ff4444'} />
        <Metric label="Active" value={stats.activeTasks} color="#4a9eff" />
        <Metric label="Approval" value={stats.awaitingApproval} color={stats.awaitingApproval > 0 ? '#ff9f43' : '#666'} />
        <Metric label="Done 24h" value={stats.completedToday} color="#22c55e" />
      </div>

      {/* Bottom: agent links */}
      <div style={{
        position: 'absolute', bottom: 24, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: 8,
      }}>
        <HUDButton href="/talk" label="🎤 Voice" />
        <HUDButton href="/jarvis" label="📊 Dashboard" />
      </div>

      {/* Selected agent panel */}
      {selected && selectedAgent && (
        <div style={{
          position: 'absolute', top: 80, right: 28, width: 280,
          background: 'rgba(5,5,20,0.9)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 20, backdropFilter: 'blur(12px)',
          fontFamily: '-apple-system, sans-serif', color: '#fff',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{selectedAgent.name}</h3>
            <button type="button" onClick={onClose} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
              cursor: 'pointer', fontSize: 18, padding: 0,
            }}>×</button>
          </div>

          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
            Status: <span style={{ color: selectedAgent.status === 'idle' ? '#666' : '#00ff88' }}>{selectedAgent.status}</span>
          </div>

          {selectedAgent.currentTask && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 12, lineHeight: 1.5 }}>
              Current: {selectedAgent.currentTask}
            </div>
          )}

          {agentTasks.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
                Recent tasks
              </div>
              {agentTasks.slice(0, 3).map((t) => (
                <div key={t.id} style={{
                  fontSize: 11, color: 'rgba(255,255,255,0.35)', padding: '6px 0',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <span style={{
                    display: 'inline-block', width: 6, height: 6, borderRadius: 3, marginRight: 8,
                    background: t.status === 'done' ? '#22c55e' : t.status === 'error' ? '#ef4444' : '#4a9eff',
                  }} />
                  {t.cmd?.slice(0, 50) ?? t.kind}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

function Metric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ textAlign: 'center', fontFamily: '-apple-system, sans-serif' }}>
      <div style={{ fontSize: 22, fontWeight: 600, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 }}>{label}</div>
    </div>
  )
}

function HUDButton({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} style={{
      padding: '8px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
      textDecoration: 'none', background: 'rgba(5,5,20,0.6)',
      backdropFilter: 'blur(8px)', letterSpacing: 1,
    }}>
      {label}
    </a>
  )
}
