import { cn } from '@/lib/utils'
import { ChatDataCard } from './ChatDataCard'
import type { ChatDataCardData } from './ChatDataCard'
import type { ChatMessage } from '@/lib/types'

interface Props {
  message: ChatMessage
  onAction?: (action: string, payload?: Record<string, unknown>) => void
}

export function ChatBubble({ message, onAction }: Props) {
  const isUser = message.role === 'user'
  const dataCard = message.metadata?.data_card as ChatDataCardData | undefined

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

        {/* Inline Data Card */}
        {dataCard && dataCard.title && (
          <ChatDataCard
            data={dataCard}
            onAction={(action, payload) => onAction?.(action, payload)}
          />
        )}

        {/* Action Buttons */}
        {message.metadata?.actions && message.metadata.actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.metadata.actions.map((a, i) => (
              <button
                key={i}
                onClick={() => onAction?.(a.action)}
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
