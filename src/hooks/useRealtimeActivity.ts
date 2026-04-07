'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useStore } from '@/lib/store'
import type { AgentActivity } from '@/lib/types'

export function useRealtimeActivity(clientId: string | undefined) {
  const addActivity = useStore((s) => s.addActivity)

  useEffect(() => {
    if (!clientId) return
    const channel = supabase
      .channel(`agent_activity:${clientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_activity',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => addActivity(payload.new as AgentActivity)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clientId, addActivity])
}
