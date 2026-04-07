'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <main className="radial-glow flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-card bg-accent font-mono text-lg font-semibold text-white">
            A
          </div>
          <span className="text-xl font-semibold tracking-tight text-text-primary">AuraFlow</span>
        </div>

        {sent ? (
          <div className="rounded-card border border-border bg-bg-card p-6">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-gold">
              Check your email
            </div>
            <h2 className="mb-2 text-lg font-semibold text-text-primary">We sent you a login link</h2>
            <p className="text-sm text-text-muted">
              Tap the link in the email we sent to <span className="text-text-secondary">{email}</span> to
              access your operating system.
            </p>
          </div>
        ) : (
          <>
            <h1 className="mb-1 text-2xl font-semibold text-text-primary">Welcome back</h1>
            <p className="mb-8 text-sm text-text-muted">
              Enter your email to access your operating system
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-gold">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-input border border-border bg-bg-card px-4 py-3 text-text-primary placeholder:text-text-dim focus:border-border-active focus:outline-none"
                />
              </div>

              {error && <div className="text-sm text-danger">{error}</div>}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-input bg-accent py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send magic link'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
