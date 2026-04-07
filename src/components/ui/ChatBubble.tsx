import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/lib/types'

interface Props {
  message: ChatMessage
  onAction?: (action: string) => void
}

export function ChatBubble({ message, onAction }: Props) {
  const isUser = message.role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-card px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-accent text-white'
            : 'border border-border bg-bg-card text-text-primary'
        )}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
        {message.metadata?.actions && message.metadata.actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.metadata.actions.map((a, i) => (
              <button
                key={i}
                onClick={() => onAction?.(a.label)}
                className="rounded-pill border border-border-active bg-accent-glow px-3 py-1 text-xs font-medium text-accent-bright transition-colors hover:bg-accent hover:text-white"
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
