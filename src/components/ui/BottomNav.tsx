'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, BarChart3, MessageSquare, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' },
  { href: '/leads', label: 'Leads', icon: Users, match: (p: string) => p.startsWith('/leads') },
  { href: '/reports', label: 'Reports', icon: BarChart3, match: (p: string) => p.startsWith('/reports') },
  { href: '/chat', label: 'Chat', icon: MessageSquare, match: (p: string) => p.startsWith('/chat') },
  { href: '/settings', label: 'More', icon: Menu, match: (p: string) => p.startsWith('/settings') || p.startsWith('/agents') },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border">
      <div className="mx-auto flex max-w-lg items-stretch">
        {tabs.map((t) => {
          const active = t.match(pathname)
          const Icon = t.icon
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors',
                active ? 'text-accent-bright' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
              <span className="font-mono text-[10px] uppercase tracking-wide">{t.label}</span>
            </Link>
          )
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
