'use client'

import { useEffect, useRef } from 'react'

export function usePushSubscription() {
  const registered = useRef(false)

  useEffect(() => {
    if (registered.current) return
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    // Only request after user has interacted with the page
    const requestSubscription = async () => {
      if (registered.current) return
      registered.current = true

      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidPublicKey) return

        const registration = await navigator.serviceWorker.ready

        // Check if already subscribed
        const existing = await registration.pushManager.getSubscription()
        if (existing) {
          // Re-register to ensure server has it
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(existing.toJSON()),
          })
          return
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        })

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription.toJSON()),
        })
      } catch (e) {
        // Non-critical — don't block app
        console.error('Push subscription failed:', e)
      }
    }

    // Defer until after first user interaction to avoid intrusive prompt
    const handler = () => {
      window.removeEventListener('click', handler)
      void requestSubscription()
    }
    window.addEventListener('click', handler, { once: true })

    return () => window.removeEventListener('click', handler)
  }, [])
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer
}
