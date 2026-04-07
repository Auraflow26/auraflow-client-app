import { formatDistanceToNow, format, parseISO } from 'date-fns'

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatCurrency(n: number | null | undefined, compact = false): string {
  if (n == null) return '$0'
  if (compact && n >= 1000) {
    return `$${(n / 1000).toFixed(1)}k`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '0'
  return new Intl.NumberFormat('en-US').format(n)
}

export function formatPercent(n: number | null | undefined, digits = 0): string {
  if (n == null) return '0%'
  return `${n.toFixed(digits)}%`
}

export function formatDuration(sec: number | null | undefined): string {
  if (sec == null) return '—'
  if (sec < 60) return `${sec}s`
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`
  return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`
}

export function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true })
  } catch {
    return ''
  }
}

export function formatDate(iso: string, fmt = 'MMM d, yyyy'): string {
  try {
    return format(parseISO(iso), fmt)
  } catch {
    return ''
  }
}

export function greeting(name: string, hour = new Date().getHours()): string {
  const part = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  return `Good ${part}, ${name}.`
}

export function scoreColor(score: number): string {
  if (score >= 70) return '#10b981'
  if (score >= 50) return '#8b5cf6'
  if (score >= 30) return '#f59e0b'
  return '#ef4444'
}

export function leadScoreBadge(score: number): { label: string; color: string; bg: string } {
  if (score >= 90) return { label: 'Hot', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
  if (score >= 60) return { label: 'Warm', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
  return { label: 'Cold', color: '#7c7291', bg: 'rgba(124,114,145,0.12)' }
}

export function trendIndicator(value: number): { symbol: string; color: string } {
  if (value > 0) return { symbol: '↑', color: '#10b981' }
  if (value < 0) return { symbol: '↓', color: '#ef4444' }
  return { symbol: '→', color: '#7c7291' }
}
