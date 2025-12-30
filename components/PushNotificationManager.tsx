'use client'

import { useEffect, useState } from 'react'
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPushNotifications,
  getPushSubscription,
  unsubscribeFromPushNotifications,
  saveSubscriptionToServer,
  deleteSubscriptionFromServer,
} from '@/lib/push-notifications'

/**
 * 푸시 알림 관리 컴포넌트
 * 앱 초기 로드 시 자동으로 푸시 알림을 활성화합니다.
 */
export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    // 브라우저 지원 여부 확인
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
      initializePushNotifications()
    }
  }, [])

  const initializePushNotifications = async () => {
    try {
      // 현재 권한 상태 확인
      const currentPermission = Notification.permission
      setPermission(currentPermission)
      console.log('현재 알림 권한 상태:', currentPermission)

      // 1. Service Worker 등록
      const registration = await registerServiceWorker()
      if (!registration) {
        console.warn('Service Worker 등록 실패')
        return
      }

      // 2. 기존 구독 확인
      const existingSubscription = await getPushSubscription(registration)
      if (existingSubscription) {
        console.log('기존 푸시 구독 발견')
        setIsSubscribed(true)
        return
      }

      // 3. 권한이 이미 거부된 경우
      if (currentPermission === 'denied') {
        console.warn('알림 권한이 거부되어 있습니다. 브라우저 설정에서 수동으로 허용해주세요.')
        console.log('권한 재설정 방법: 브라우저 주소창 왼쪽의 자물쇠 아이콘 클릭 → 사이트 설정 → 알림 → 허용')
        return
      }

      // 4. 권한 요청 (default 상태일 때만)
      const permissionResult = await requestNotificationPermission()
      setPermission(permissionResult)
      console.log('권한 요청 결과:', permissionResult)

      if (permissionResult !== 'granted') {
        if (permissionResult === 'denied') {
          console.warn('사용자가 알림 권한을 거부했습니다.')
        }
        return
      }

      // 5. 푸시 구독 생성
      const subscription = await subscribeToPushNotifications(registration)
      if (!subscription) {
        console.error('푸시 구독 생성 실패')
        return
      }

      // 6. 서버에 구독 정보 저장
      const saved = await saveSubscriptionToServer(subscription)
      if (saved) {
        setIsSubscribed(true)
        console.log('푸시 알림 구독 완료!')
      }
    } catch (error) {
      console.error('푸시 알림 초기화 실패:', error)
    }
  }

  const handleUnsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await getPushSubscription(registration)
      
      if (subscription) {
        await unsubscribeFromPushNotifications(registration)
        await deleteSubscriptionFromServer(subscription.endpoint)
        setIsSubscribed(false)
      }
    } catch (error) {
      console.error('푸시 구독 해제 실패:', error)
    }
  }

  // 지원하지 않는 브라우저에서는 아무것도 렌더링하지 않음
  if (!isSupported) {
    return null
  }

  // 개발 모드에서만 상태 표시
  if (process.env.NODE_ENV === 'development') {
    const permissionText = 
      permission === 'granted' ? '✅ 허용' :
      permission === 'denied' ? '❌ 거부' :
      '⏳ 대기중'
    
    return (
      <div className="fixed bottom-24 left-4 bg-gray-800 text-white text-xs p-2 rounded opacity-70 z-50 max-w-xs">
        <div>푸시: {isSubscribed ? '✅ 구독됨' : '❌ 미구독'}</div>
        <div>권한: {permissionText}</div>
        {permission === 'denied' && (
          <div className="mt-1 text-yellow-300 text-[10px]">
            브라우저 설정에서 수동 허용 필요
          </div>
        )}
      </div>
    )
  }

  return null
}

