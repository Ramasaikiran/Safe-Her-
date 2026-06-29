/**
 * Push notifications for SafeShe SOS.
 * Uses Web Push API — works on Android Chrome, Samsung Browser.
 * iOS Safari 16.4+ supports it too when added to home screen.
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export async function requestPushPermission(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported in this browser')
    return null
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  try {
    const reg = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()
    if (existing) return existing

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as string,
    })
    return subscription
  } catch (err) {
    console.error('Push subscription failed:', err)
    return null
  }
}

export async function savePushSubscription(userId: string, subscription: PushSubscription) {
  const { supabase } = await import('./supabase')
  const sub = subscription.toJSON()
  await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint: sub.endpoint,
    p256dh: (sub.keys as any)?.p256dh,
    auth: (sub.keys as any)?.auth,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
}

export async function sendLocalSOSNotification(message = 'SOS activated — sharing your location now.') {
  if (Notification.permission === 'granted') {
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification('🚨 SafeShe SOS Active', {
      body: message,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: 'sos-alert',
      requireInteraction: true,
      actions: [
        { action: 'dashboard', title: 'Open dashboard' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    } as any)
  }
}
