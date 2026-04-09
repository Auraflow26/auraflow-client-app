'use client'

import { usePushSubscription } from '@/hooks/usePushSubscription'

// Thin client component — mounts the push subscription hook in the dashboard layout.
// Subscribes after first user interaction to avoid intrusive prompt.
export function PushSubscriptionInit() {
  usePushSubscription()
  return null
}
