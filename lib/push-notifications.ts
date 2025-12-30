/**
 * 웹 푸시 알림 관련 유틸리티 함수
 * 실무에서 많이 사용하는 패턴으로 구현했습니다.
 */

// VAPID 공개 키 (환경 변수에서 가져옴)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

/**
 * Service Worker 등록
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('Service Worker를 지원하지 않는 브라우저입니다.')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })
    console.log('Service Worker 등록 성공:', registration.scope)
    return registration
  } catch (error) {
    console.error('Service Worker 등록 실패:', error)
    return null
  }
}

/**
 * 푸시 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  const permission = await Notification.requestPermission()
  return permission
}

/**
 * 푸시 구독 생성
 */
export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  if (!VAPID_PUBLIC_KEY) {
    console.error('VAPID_PUBLIC_KEY가 설정되지 않았습니다.')
    return null
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    console.log('푸시 구독 성공:', subscription)
    return subscription
  } catch (error) {
    console.error('푸시 구독 실패:', error)
    return null
  }
}

/**
 * 기존 푸시 구독 조회
 */
export async function getPushSubscription(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.getSubscription()
    return subscription
  } catch (error) {
    console.error('푸시 구독 조회 실패:', error)
    return null
  }
}

/**
 * 푸시 구독 해제
 */
export async function unsubscribeFromPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<boolean> {
  try {
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
      console.log('푸시 구독 해제 성공')
      return true
    }
    return false
  } catch (error) {
    console.error('푸시 구독 해제 실패:', error)
    return false
  }
}

/**
 * 푸시 구독 정보를 서버에 저장
 */
export async function saveSubscriptionToServer(
  subscription: PushSubscription
): Promise<boolean> {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
            auth: arrayBufferToBase64(subscription.getKey('auth')!),
          },
        },
      }),
    })

    if (!response.ok) {
      throw new Error('구독 정보 저장 실패')
    }

    console.log('구독 정보 저장 성공')
    return true
  } catch (error) {
    console.error('구독 정보 저장 실패:', error)
    return false
  }
}

/**
 * 서버에서 푸시 구독 정보 삭제
 */
export async function deleteSubscriptionFromServer(
  endpoint: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endpoint }),
    })

    if (!response.ok) {
      throw new Error('구독 정보 삭제 실패')
    }

    console.log('구독 정보 삭제 성공')
    return true
  } catch (error) {
    console.error('구독 정보 삭제 실패:', error)
    return false
  }
}

/**
 * VAPID 키를 Uint8Array로 변환
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * ArrayBuffer를 Base64로 변환
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

