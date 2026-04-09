'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Zap } from 'lucide-react'
import { ChatBubble } from '@/components/ui/ChatBubble'
import type { ChatMessage } from '@/lib/types'

const SUGGESTIONS = [
  'How are my leads looking this month?',
  "What's my ad spend and ROAS?",
  'Which lead source is performing best?',
  'How fast are we responding to leads?',
  'What should I focus on this week?',
  'How are my Google reviews trending?',
]

export function ChatView({ initialMessages }: { initialMessages: ChatMessage[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return

    const userMsg: ChatMessage = {
      id: `tmp-${Date.now()}`,
      client_id: '',
      role: 'user',
      content: text.trim(),
      metadata: {},
      created_at: new Date().toISOString(),
    }
    const assistantId = `tmp-${Date.now()}-a`

    setMessages((m) => [...m, userMsg])
    setInput('')
    setSending(true)

    // Add empty assistant message immediately to show streaming
    setMessages((m) => [
      ...m,
      {
        id: assistantId,
        client_id: '',
        role: 'assistant',
        content: '',
        metadata: {},
        created_at: new Date().toISOString(),
      },
    ])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
      })

      if (!res.ok || !res.body) throw new Error('Request failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.delta) {
              setMessages((m) =>
                m.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, content: msg.content + data.delta }
                    : msg
                )
              )
            }
            if (data.error) {
              setMessages((m) =>
                m.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, content: 'Sorry — something went wrong. Please try again.' }
                    : msg
                )
              )
            }
          } catch {
            // skip malformed SSE line
          }
        }
      }
    } catch {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: 'Sorry — something went wrong. Please try again.' }
            : msg
        )
      )
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  // Execute chat actions via the bridge
  async function executeAction(action: string, payload?: Record<string, unknown>) {
    try {
      const res = await fetch('/api/chat/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      })
      const data = await res.json()
      if (data.result) {
        sendMessage(`Action "${action}" completed. Show me the result.`)
      }
    } catch {
      sendMessage(`I tried to execute "${action}" but encountered an error.`)
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-screen flex-col pb-16">
      <header className="glass sticky top-0 z-30 border-b border-border">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-glow font-mono text-sm font-bold text-accent-bright">
            A
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-text-primary leading-tight">AuraFlow Intelligence</h1>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span className="font-mono text-[10px] uppercase text-text-muted">Active · Grounded in your data</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 overflow-y-auto px-4 py-4">
        {isEmpty ? (
          <div className="mt-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent-glow">
                <Zap size={24} className="text-accent-bright" />
              </div>
              <h2 className="mb-1 text-lg font-semibold text-text-primary">Ask anything</h2>
              <p className="text-sm text-text-muted">
                Every answer is grounded in your real business data.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  className="rounded-input border border-border bg-bg-card px-4 py-3 text-left text-sm text-text-secondary transition-colors hover:border-border-active hover:text-text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} onAction={executeAction} />
            ))}
            {sending && messages[messages.length - 1]?.content === '' && (
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
        onSubmit={handleSubmit}
        className="glass fixed inset-x-0 bottom-16 z-20 border-t border-border"
      >
        <div className="mx-auto flex max-w-lg items-center gap-2 px-4 py-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your leads, ads, reviews…"
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
