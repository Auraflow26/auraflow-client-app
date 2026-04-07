'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useStore } from '@/lib/store'
import type { Notification } from '@/lib/types'

export function useNotifications(clientId: string | undefined) {
  const setUnreadCount = useStore((s) => s.setUnreadCount)
  const setNotifications = useStore((s) => s.setNotifications)

  useEffect(() => {
    if (!clientId) return
    ;(async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) {
        setNotifications(data as Notification[])
        setUnreadCount(data.filter((n) => !n.read).length)
      }
    })()

    const channel = supabase
      .channel(`notifications:${clientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `client_id=eq.${clientId}`,
        },
        () => {
          setUnreadCount(useStore.getState().unreadCount + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clientId, setNotifications, setUnreadCount])
}
