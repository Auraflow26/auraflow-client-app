'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'
import { useStore } from '@/lib/store'

interface DashboardHeaderProps {
  title: string
  subtitle?: string
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const unread = useStore((s) => s.unreadCount)
  return (
    <header className="glass sticky top-0 z-30 border-b border-border">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-text-primary">{title}</h1>
          {subtitle && <div className="truncate text-xs text-text-muted">{subtitle}</div>}
        </div>
        <Link
          href="/notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:border-border-active hover:text-text-primary"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 font-mono text-[9px] font-semibold text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
