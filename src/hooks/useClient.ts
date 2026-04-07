'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useStore } from '@/lib/store'
import type { ClientProfile } from '@/lib/types'

export function useClient() {
  const profile = useStore((s) => s.profile)
  const setProfile = useStore((s) => s.setProfile)

  useEffect(() => {
    if (profile) return
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (data) setProfile(data as ClientProfile)
    })()
  }, [profile, setProfile])

  return profile
}
