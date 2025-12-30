// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {}
  const title = data.title || '새 임장 기록이 등록되었습니다'
  const options = {
    body: data.body || '임장 기록을 확인해보세요',
    icon: '/icon-192x192.png', // 아이콘 경로 (필요시 추가)
    badge: '/badge-72x72.png', // 배지 경로 (필요시 추가)
    data: data.url || '/',
    requireInteraction: false,
    tag: 'new-record',
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// 알림 클릭 시 처리
self.addEventListener('notificationclick', function(event) {
  event.notification.close()

  const urlToOpen = event.notification.data || '/'

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then(function(clientList) {
      // 이미 열려있는 탭이 있으면 포커스
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // 새 탭 열기
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

