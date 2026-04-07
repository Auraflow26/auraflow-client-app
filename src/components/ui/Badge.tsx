import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  color?: string
  bg?: string
  className?: string
}

export function Badge({ children, color, bg, className }: BadgeProps) {
  const style =
    color || bg
      ? { color: color ?? '#c4b5fd', backgroundColor: bg ?? 'rgba(139,92,246,0.12)' }
      : undefined
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide',
        !style && 'bg-accent-glow text-accent-bright',
        className
      )}
      style={style}
    >
      {children}
    </span>
  )
}
