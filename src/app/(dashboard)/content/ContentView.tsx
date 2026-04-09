'use client'

import { useState } from 'react'
import { Send, CheckCircle } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import type { AgentActivity } from '@/lib/types'

const PLATFORMS = [
  { value: 'ig',    label: 'Instagram Caption' },
  { value: 'ads',   label: 'Ad Copy' },
  { value: 'email', label: 'Email Newsletter' },
  { value: 'blog',  label: 'Blog Post' },
] as const

type Platform = typeof PLATFORMS[number]['value']

export function ContentView({ history }: { history: AgentActivity[] }) {
  const [platform, setPlatform] = useState<Platform>('ig')
  const [brief, setBrief] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!brief.trim() || submitting) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, brief }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit')
      setSuccess(true)
      setBrief('')
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Request form */}
      <section>
        <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-gold">New Request</div>
        <div className="rounded-card border border-border bg-bg-card p-4">
          <form onSubmit={submit} className="space-y-4">
            {/* Platform selector */}
            <div>
              <label className="mb-2 block text-xs text-text-muted">Content Type</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => (
                  <button
                    type="button"
                    key={p.value}
                    onClick={() => setPlatform(p.value)}
                    className={`rounded-pill border px-3 py-1.5 font-mono text-[11px] transition-colors ${
                      platform === p.value
                        ? 'border-accent bg-accent text-white'
                        : 'border-border text-text-secondary hover:border-border-active'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Brief */}
            <div>
              <label className="mb-2 block text-xs text-text-muted">
                Brief <span className="text-text-dim">(topic, tone, key points)</span>
              </label>
              <textarea
                value={brief}
                onChange={e => setBrief(e.target.value)}
                placeholder="e.g. Spring HVAC tune-up promotion, friendly tone, emphasize 20% discount and fast scheduling…"
                rows={4}
                className="w-full rounded-input border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:border-border-active focus:outline-none resize-none"
              />
              <div className="mt-1 text-right font-mono text-[10px] text-text-dim">
                {brief.length} chars
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-input border border-green-500/20 bg-green-500/10 px-3 py-2 text-sm text-green-400">
                <CheckCircle size={14} />
                Dispatched to AuraFlow Content Engine
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || brief.trim().length < 10}
              className="flex w-full items-center justify-center gap-2 rounded-input bg-accent py-3 font-medium text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Send size={14} />
              {submitting ? 'Submitting…' : 'Request Content'}
            </button>
          </form>
        </div>
      </section>

      {/* History */}
      {history.length > 0 && (
        <section>
          <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-gold">Recent Requests</div>
          <div className="space-y-2">
            {history.map(item => (
              <div key={item.id} className="rounded-card border border-border bg-bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-text-primary truncate">{item.action}</div>
                    {item.details && (
                      <div className="mt-0.5 text-xs text-text-muted line-clamp-2">{item.details}</div>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-text-dim whitespace-nowrap">{timeAgo(item.created_at)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`rounded-pill border px-2 py-0.5 font-mono text-[10px] ${
                    item.status === 'completed'
                      ? 'border-green-500/30 text-green-400'
                      : item.status === 'in_progress'
                      ? 'border-accent/30 text-accent-bright'
                      : 'border-border text-text-muted'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {history.length === 0 && (
        <div className="rounded-card border border-border bg-bg-card p-8 text-center">
          <div className="text-sm text-text-muted">No content requests yet</div>
          <div className="mt-1 text-xs text-text-dim">Submit your first request above</div>
        </div>
      )}
    </div>
  )
}
