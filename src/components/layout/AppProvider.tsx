'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'
import { useRealtimeActivity } from '@/hooks/useRealtimeActivity'
import { useNotifications } from '@/hooks/useNotifications'
import type { ClientProfile } from '@/lib/types'

export function AppProvider({
  profile,
  children,
}: {
  profile: ClientProfile
  children: React.ReactNode
}) {
  const setProfile = useStore((s) => s.setProfile)

  useEffect(() => {
    setProfile(profile)
  }, [profile, setProfile])

  useRealtimeActivity(profile.client_id)
  useNotifications(profile.client_id)

  return <>{children}</>
}
