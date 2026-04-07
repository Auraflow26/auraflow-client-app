'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full rounded-card border border-border bg-bg-card py-3 text-sm font-medium text-danger transition-colors hover:border-danger/40"
    >
      Log out
    </button>
  )
}
