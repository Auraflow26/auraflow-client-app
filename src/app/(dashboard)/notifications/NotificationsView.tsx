'use client'

import { useEffect, useState } from 'react'
import { Bell, Zap, Star, AlertTriangle, MessageSquare, BarChart2, CheckCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useStore } from '@/lib/store'
import { timeAgo } from '@/lib/utils'
import type { Notification, NotificationType } from '@/lib/types'

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string }> = {
  lead_new:        { icon: Zap,           color: '#10b981' },
  lead_hot:        { icon: Zap,           color: '#ef4444' },
  review_new:      { icon: Star,          color: '#d4af37' },
  review_negative: { icon: Star,          color: '#ef4444' },
  agent_action:    { icon: Bell,          color: '#8b5cf6' },
  advisor_message: { icon: MessageSquare, color: '#a78bfa' },
  report_ready:    { icon: BarChart2,     color: '#3b82f6' },
  system_alert:    { icon: AlertTriangle, color: '#f59e0b' },
}

const SEVERITY_BORDER: Record<string, string> = {
  critical: 'border-l-2 border-l-danger',
  high:     'border-l-2 border-l-warning',
  medium:   'border-l-2 border-l-accent',
  low:      '',
}

interface Props {
  notifications: Notification[]
  clientId: string
}

export function NotificationsView({ notifications: initial, clientId }: Props) {
  const [items, setItems] = useState(initial)
  const setUnreadCount = useStore((s) => s.setUnreadCount)

  // Mark all unread as read on mount
  useEffect(() => {
    const unreadIds = initial.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length === 0) return

    supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds)
      .then(() => {
        setItems((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function markOneRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount(Math.max(0, items.filter((n) => !n.read).length - 1))
  }

  const unread = items.filter((n) => !n.read)
  const read = items.filter((n) => n.read)

  if (items.length === 0) {
    return (
      <div className="pt-20 text-center">
        <Bell size={32} className="mx-auto mb-3 text-text-dim" />
        <p className="text-sm text-text-muted">No notifications yet.</p>
        <p className="mt-1 text-xs text-text-dim">Your system is running. We&apos;ll notify you of important events.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {unread.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-wider text-gold">
              New · {unread.length}
            </div>
            <button
              type="button"
              onClick={() => {
                supabase.from('notifications').update({ read: true }).eq('client_id', clientId).eq('read', false)
                setItems((prev) => prev.map((n) => ({ ...n, read: true })))
                setUnreadCount(0)
              }}
              className="flex items-center gap-1 font-mono text-[10px] uppercase text-accent-bright hover:text-accent-light"
            >
              <CheckCheck size={12} />
              Mark all read
            </button>
          </div>
          <div className="rounded-card border border-border bg-bg-card divide-y divide-border overflow-hidden">
            {unread.map((n) => (
              <NotificationRow key={n.id} notification={n} onRead={markOneRead} />
            ))}
          </div>
        </section>
      )}

      {read.length > 0 && (
        <section>
          <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-gold">Earlier</div>
          <div className="rounded-card border border-border bg-bg-card divide-y divide-border overflow-hidden">
            {read.map((n) => (
              <NotificationRow key={n.id} notification={n} onRead={markOneRead} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function NotificationRow({
  notification: n,
  onRead,
}: {
  notification: Notification
  onRead: (id: string) => void
}) {
  const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system_alert
  const Icon = config.icon
  const borderClass = SEVERITY_BORDER[n.severity] ?? ''

  const rowClass = `w-full text-left flex items-start gap-3 px-4 py-3.5 transition-colors ${borderClass} ${!n.read ? 'bg-accent-glow/30' : ''}`

  const content = (
    <>
      <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-bg-elevated">
        <Icon size={14} color={config.color} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className={`text-sm ${n.read ? 'text-text-secondary' : 'font-medium text-text-primary'}`}>
            {n.title}
          </span>
          <span className="flex-shrink-0 font-mono text-[10px] text-text-muted">{timeAgo(n.created_at)}</span>
        </div>
        {n.body && <p className="mt-0.5 text-xs text-text-muted line-clamp-2">{n.body}</p>}
      </div>
      {!n.read && <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-accent" />}
    </>
  )

  if (!n.read) {
    return (
      <button type="button" className={rowClass} onClick={() => onRead(n.id)}>
        {content}
      </button>
    )
  }

  return <div className={rowClass}>{content}</div>
}
