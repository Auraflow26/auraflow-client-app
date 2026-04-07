'use client'

import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { ChatBubble } from '@/components/ui/ChatBubble'
import type { ChatMessage } from '@/lib/types'

export function ChatView({ initialMessages }: { initialMessages: ChatMessage[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      client_id: '',
      role: 'user',
      content: text,
      metadata: {},
      created_at: new Date().toISOString(),
    }
    setMessages((m) => [...m, optimistic])
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      if (data.reply) {
        setMessages((m) => [
          ...m,
          {
            id: `tmp-${Date.now()}-a`,
            client_id: '',
            role: 'assistant',
            content: data.reply,
            metadata: data.metadata ?? {},
            created_at: new Date().toISOString(),
          },
        ])
      } else if (data.error) {
        setMessages((m) => [
          ...m,
          {
            id: `tmp-${Date.now()}-e`,
            client_id: '',
            role: 'assistant',
            content: `Sorry — something went wrong. ${data.error}`,
            metadata: {},
            created_at: new Date().toISOString(),
          },
        ])
      }
    } catch {
      // swallow, show nothing
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-screen flex-col pb-16">
      <header className="glass sticky top-0 z-30 border-b border-border">
        <div className="mx-auto flex max-w-lg items-center gap-2 px-4 py-3">
          <h1 className="text-lg font-semibold text-text-primary">AuraFlow Intelligence</h1>
          <span className="h-2 w-2 rounded-full bg-success" />
          <span className="font-mono text-[10px] uppercase text-text-muted">Active</span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="mt-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-glow font-mono text-lg text-accent-bright">
              A
            </div>
            <h2 className="mb-1 text-lg font-semibold text-text-primary">
              How can I help?
            </h2>
            <p className="text-sm text-text-muted">
              Ask about your leads, ads, reviews, or anything.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} />
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-card border border-border bg-bg-card px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-accent [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-accent [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="glass fixed inset-x-0 bottom-16 z-20 border-t border-border"
      >
        <div className="mx-auto flex max-w-lg items-center gap-2 px-4 py-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your leads, ads, reviews, or anything..."
            className="flex-1 rounded-input border border-border bg-bg-card px-4 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:border-border-active focus:outline-none"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="flex h-10 w-10 items-center justify-center rounded-input bg-accent text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  )
}
