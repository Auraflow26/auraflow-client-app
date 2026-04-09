'use client'

import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useStore } from '@/lib/store'
import type { Directive } from '@/lib/intelligence/types'

export function useRealtimeDirectives(clientId: string | undefined) {
  const addDirective = useStore((s) => s.addDirective)

  useEffect(() => {
    if (!clientId) return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel('directives-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'directives',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          addDirective(payload.new as Directive)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clientId, addDirective])
}
