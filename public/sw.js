// SafeShe Service Worker — handles push notifications

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  const title = data.title || '🚨 SafeShe Alert'
  const options = {
    body: data.body || 'You have a new notification from SafeShe.',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: data.sos ? [200, 100, 200, 100, 200, 100, 400] : [200, 100, 200],
    tag: data.tag || 'safeshe-notification',
    requireInteraction: data.sos || false,
    data: { url: data.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      return clients.openWindow(url)
    })
  )
})

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()))
